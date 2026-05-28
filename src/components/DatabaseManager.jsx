import { useState } from 'react';
import TableEditor from './TableEditor';
import SqlEditor from './SqlEditor';
import { Button } from './ui';

const DatabaseManager = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('table');

  return (
    <div className="min-h-screen bg-dark-300">
      <div className="sticky top-0 z-10 bg-dark-300/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack} className="h-10">
                返回
              </Button>
              <h1 className="text-xl font-bold text-white">数据库管理</h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('table')}
                className={activeTab === 'table' ? 'bg-primary-600' : 'bg-gray-700'}
              >
                表编辑器
              </Button>
              <Button
                onClick={() => setActiveTab('sql')}
                className={activeTab === 'sql' ? 'bg-primary-600' : 'bg-gray-700'}
              >
                SQL 编辑器
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'table' ? (
          <TableEditor />
        ) : (
          <SqlEditor />
        )}
      </div>
    </div>
  );
};

export default DatabaseManager;