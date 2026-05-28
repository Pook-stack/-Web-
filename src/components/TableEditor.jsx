import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Button } from './ui';

const TableEditor = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: tableData, error: tableError } = await supabase.rpc('list_tables');
      if (tableError) throw tableError;
      
      const tableNames = tableData?.map(t => t.table_name) || ['clubs', 'users', 'club_members', 'applications', 'notifications'];
      setTables(tableNames.filter(t => t));
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setError('无法获取表列表，请检查数据库连接');
      setTables(['clubs', 'users', 'club_members', 'applications', 'notifications']);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setLoading(true);
    setError(null);
    try {
      const { data: tableData, error: dataError } = await supabase.from(tableName).select('*');
      if (dataError) throw dataError;
      
      setData(tableData || []);
      if (tableData && tableData.length > 0) {
        setColumns(Object.keys(tableData[0]));
      } else {
        setColumns([]);
      }
      setSelectedTable(tableName);
      setEditingRow(null);
      setEditData({});
    } catch (err) {
      console.error('Failed to fetch table data:', err);
      setError(err.message);
      setData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row, index) => {
    setEditingRow(index);
    setEditData({ ...row });
  };

  const handleSave = async (index) => {
    setLoading(true);
    try {
      const row = data[index];
      const id = row.id || row.id;
      
      const { error: updateError } = await supabase
        .from(selectedTable)
        .update(editData)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      const updatedData = [...data];
      updatedData[index] = { ...editData };
      setData(updatedData);
      setEditingRow(null);
      setEditData({});
    } catch (err) {
      console.error('Failed to update row:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    
    setLoading(true);
    try {
      const row = data[index];
      const id = row.id || row.id;
      
      const { error: deleteError } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      const updatedData = data.filter((_, i) => i !== index);
      setData(updatedData);
    } catch (err) {
      console.error('Failed to delete row:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData({});
  };

  if (loading && !selectedTable) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tables.map(table => (
          <Button
            key={table}
            onClick={() => fetchTableData(table)}
            className={`${selectedTable === table ? 'bg-primary-600' : 'bg-gray-700'}`}
          >
            {table}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {selectedTable && (
        <div className="bg-white/5 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">
              {selectedTable} - {data.length} 条记录
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-3">
                        {editingRow === index ? (
                          <input
                            type="text"
                            value={editData[col] !== undefined ? String(editData[col]) : ''}
                            onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-300">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      {editingRow === index ? (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleSave(index)}>
                            保存
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            取消
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(row, index)}>
                            编辑
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(index)}>
                            删除
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                该表暂无数据
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableEditor;