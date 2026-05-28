import { useState, useRef } from 'react';
import { imageService } from '../../services/imageService';

const ImageUploader = ({ 
  value, 
  onChange, 
  folder = 'uploads',
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024, // 5MB
  aspectRatio = 1,
  label = '上传图片',
  showCrop = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(value);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      return '不支持的图片格式，请上传 JPG、PNG 或 WEBP 格式';
    }
    
    if (file.size > maxSize) {
      return `图片大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    
    return null;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
      setShowModal(true);
    };
    reader.readAsDataURL(file);

    // 保存文件引用
    file.preview = preview;
    file.selectedFile = file;
  };

  const handleUpload = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.[0]) return;

    const file = fileInput.files[0];
    setUploading(true);
    setProgress(0);
    setError(null);

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await imageService.uploadImage(file, folder);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        setProgress(100);
        onChange(result.url);
        setShowModal(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (preview && preview !== value) {
      // 如果是新上传的预览，删除临时文件
    }
    setPreview(null);
    onChange('');
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
      />
      
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="预览"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100"
            >
              更换
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
            >
              删除
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-primary-400">点击上传</span> 或拖拽
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支持 JPG、PNG、WEBP，最大 5MB
            </p>
          </div>
        </label>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* 预览和确认弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">图片预览</h3>
              
              <div className="relative mb-6">
                <img
                  src={preview}
                  alt="预览"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>上传中...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-700/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '上传中...' : '确认上传'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (!value) {
                      setPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }
                  }}
                  disabled={uploading}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
