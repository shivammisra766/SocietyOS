import React, { useRef, useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [profilePic, setProfilePic] = useState(user?.profilePicture || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.profilePicture) setProfilePic(user.profilePicture);
  }, [user?.profilePicture]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be smaller than 5MB");
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    const uploadingToast = toast.loading("Uploading profile picture...");

    try {
      const res = await api.post('/users/me/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePic(res.data.profilePicture);
      toast.success("Profile picture updated!", { id: uploadingToast });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload image", { id: uploadingToast });
    } finally {
      setUploading(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="flex h-screen w-full bg-[#090b10] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-0 overflow-y-auto overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-[#090b10]/80 backdrop-blur-2xl border-b border-indigo-500/10 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             {/* Search bar removed per user request */}
          </div>
          
          <div className="flex items-center gap-6">
            {user?.role !== 'ADMIN' && (
              <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all border-none bg-transparent cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
              </button>
            )}
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-none tracking-wide">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Superadmin</p>
              </div>
              <div 
                className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-sm border border-white/10 cursor-pointer overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                ) : profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.substring(0, 2).toUpperCase() : 'AU'
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="material-symbols-outlined text-[16px] text-white">photo_camera</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
