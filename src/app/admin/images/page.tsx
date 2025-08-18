"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

interface ImageRecord {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

export default function AdminImages() {
  const router = useRouter();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const imagesPerPage = 12;

  useEffect(() => {
    checkAuth();
    loadImages();
  }, [currentPage]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/verify");
      if (!response.ok) {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/admin/login");
    }
  };

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/images?page=${currentPage}&limit=${imagesPerPage}`);
      const data = await response.json();
      
      if (data.images) {
        setImages(data.images);
      }
      
      if (data.totalPages) {
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to load images:", error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedImage) return;
    
    try {
      const response = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedImage.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowDeleteModal(false);
        setSelectedImage(null);
        loadImages();
      } else {
        console.error("Failed to delete image:", data.error);
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const filteredImages = images.filter(image =>
    image.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">图片管理</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索提示词或用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-64"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={loadImages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">总图片数</p>
            <p className="text-2xl font-bold text-gray-800">{totalPages * imagesPerPage}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">今日生成</p>
            <p className="text-2xl font-bold text-gray-800">
              {images.filter(img => 
                new Date(img.created_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">当前页</p>
            <p className="text-2xl font-bold text-gray-800">{currentPage} / {totalPages}</p>
          </div>
        </div>

        {/* 图片网格 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredImages.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredImages.map((image) => (
                  <div key={image.id} className="group relative">
                    <div 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedImage(image);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={image.image_url}
                        alt={image.prompt}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 truncate">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-700">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              暂无图片数据
            </div>
          )}
        </div>

        {/* 图片详情模态框 */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowImageModal(false)}>
            <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">图片详情</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.prompt}
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">提示词</p>
                    <p className="mt-1 text-gray-900">{selectedImage.prompt}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">用户</p>
                    <p className="mt-1 text-gray-900">{selectedImage.user_email || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">生成时间</p>
                    <p className="mt-1 text-gray-900">
                      {new Date(selectedImage.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">图片ID</p>
                    <p className="mt-1 text-gray-900 text-xs">{selectedImage.id}</p>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <a
                      href={selectedImage.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                    >
                      查看原图
                    </a>
                    <button
                      onClick={() => {
                        setShowImageModal(false);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      删除图片
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && selectedImage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                  确认删除图片
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    您确定要删除这张图片吗？此操作不可恢复。
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-400"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteImage}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 hover:bg-red-700"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}