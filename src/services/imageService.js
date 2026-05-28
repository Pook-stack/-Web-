import { supabase } from '../supabase';

const BUCKET_NAME = 'images';

export const imageService = {
  // 上传图片
  async uploadImage(file, folder = 'uploads') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('上传图片失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 删除图片
  async deleteImage(path) {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取公开URL
  getPublicUrl(path) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    return data.publicUrl;
  }
};

export default imageService;
