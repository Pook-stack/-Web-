import { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { Button } from './ui';

const SqlEditor = () => {
  const [sql, setSql] = useState('SELECT * FROM clubs LIMIT 10;');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const editorRef = useRef(null);

  const executeSQL = async () => {
    if (!sql.trim()) {
      setError('请输入SQL语句');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setColumns([]);

    try {
      const trimmedSql = sql.trim().toUpperCase();
      
      if (trimmedSql.startsWith('SELECT')) {
        const { data, error: queryError } = await supabase.rpc('execute_sql', { sql: sql });
        if (queryError) throw queryError;
        
        setResult(data || []);
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]));
        }
      } else {
        const { error: execError } = await supabase.rpc('execute_sql', { sql: sql });
        if (execError) throw execError;
        
        setResult({ success: true, message: 'SQL执行成功' });
      }
    } catch (err) {
      console.error('SQL执行失败:', err);
      setError(err.message || 'SQL执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSql('');
    setResult(null);
    setError(null);
    setColumns([]);
  };

  const handleLoadExample = (example) => {
    setSql(example);
  };

  const examples = [
    'SELECT * FROM clubs LIMIT 10;',
    'SELECT * FROM users;',
    'SELECT name, game, member_count FROM clubs WHERE status = \'approved\';',
    'INSERT INTO clubs (name, game, description, status) VALUES (\'新俱乐部\', \'王者荣耀\', \'测试俱乐部\', \'pending\');',
    'UPDATE clubs SET member_count = member_count + 1 WHERE id = 1;',
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-gray-400 text-sm">示例SQL:</span>
        {examples.map((example, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            onClick={() => handleLoadExample(example)}
            className="text-xs"
          >
            {index + 1}
          </Button>
        ))}
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <Button onClick={executeSQL} disabled={loading}>
            {loading ? '执行中...' : '执行 SQL'}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            清空
          </Button>
        </div>

        <textarea
          ref={editorRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="输入SQL语句..."
          className="w-full h-40 bg-black/30 border border-white/10 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-primary-500"
        />
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <div className="text-red-400 font-medium">错误:</div>
          <div className="text-red-300 text-sm mt-1">{error}</div>
        </div>
      )}

      {result && !error && (
        <div className="bg-white/5 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">执行结果</h3>
          </div>
          
          {typeof result === 'object' && result.success ? (
            <div className="p-4 text-green-400">
              {result.message}
            </div>
          ) : Array.isArray(result) && result.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    {columns.map(col => (
                      <th key={col} className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.map((row, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      {columns.map(col => (
                        <td key={col} className="px-4 py-3">
                          <span className="text-sm text-gray-300 font-mono">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : Array.isArray(result) && result.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              查询结果为空
            </div>
          ) : (
            <div className="p-4 text-gray-300">
              <pre className="font-mono text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SqlEditor;