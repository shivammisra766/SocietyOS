import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';

export default function AdminFlats() {
  const [modalOpen, setModalOpen] = useState(false);
  const [flatId, setFlatId] = useState('');
  const [floor, setFloor] = useState(1);
  const [flats, setFlats] = useState([]);
  const [editFlatId, setEditFlatId] = useState(null);

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = async () => {
    try {
      const res = await api.get('/flats');
      setFlats(res.data.data);
    } catch(err) {
      console.error("Failed to fetch flats", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!flatId.trim()) return;
    
    try {
      if (editFlatId) {
        await api.patch(`/flats/${editFlatId}`, {
          number: flatId,
          floor: parseInt(floor) || 1
        });
      } else {
        await api.post('/flats', {
          number: flatId,
          floor: parseInt(floor) || 1
        });
      }
      setFlatId('');
      setFloor(1);
      setEditFlatId(null);
      setModalOpen(false);
      toast.success(editFlatId ? 'Flat updated.' : 'Flat registered.');
      fetchFlats();
    } catch(err) {
      console.error("Failed to save flat", err);
      toast.error("Failed to save flat. Ensure identifier is unique.");
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-white">Delete Flat?</p>
        <p className="text-xs text-gray-400">Cannot be deleted if occupied or referenced.</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/flats/${id}`);
                toast.success('Flat deleted.');
                fetchFlats();
              } catch (err) {
                console.error("Failed to delete flat", err);
                toast.error("Failed to delete flat.");
              }
            }}
            className="flex-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
          >Confirm</button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
          >Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="pt-8 px-8 pb-12 relative min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Flat Registry</h2>
            <p className="text-gray-400 mt-1">Manage infrastructure, building blocks, and architectural unit assignments.</p>
          </div>
          <button 
            onClick={() => {
              setFlatId('');
              setFloor(1);
              setEditFlatId(null);
              setModalOpen(true);
            }}
            className="bg-white text-black px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-colors active:scale-95 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">domain_add</span>
            Register New Flat
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Total Units</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-white">{flats.length}</span>
              <span className="material-symbols-outlined text-white/50 text-4xl flex items-center">domain</span>
            </div>
          </div>
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Occupied</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-emerald-500">{(flats.filter(f => f._count?.users > 0).length)}</span>
              <span className="text-emerald-500 text-sm flex items-center gap-1 font-bold">
                Capacity
              </span>
            </div>
          </div>
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Available</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-white">{flats.filter(f => !f._count || f._count.users === 0).length}</span>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                Ready for Move-in
              </span>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5">
            <div className="relative flex-grow md:w-64 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl flex items-center">search</span>
              <input className="w-full rounded-lg pl-10 pr-4 py-2 text-sm border border-outline-variant focus:ring-1 focus:ring-neutral-400 text-white bg-white/5 border-white/10" placeholder="Search by flat or building..." type="text"/>
            </div>
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                  <span className="material-symbols-outlined text-lg flex items-center">filter_list</span> Filter
               </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 text-xs uppercase tracking-wider text-gray-400 font-bold border-b border-white/10">
                  <th className="px-6 py-4">Flat Identity</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Occupants</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {flats.map(flat => (
                  <tr key={flat.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xl font-bold text-white tracking-widest font-mono border-b border-transparent">{flat.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-300">Phase 1</span>
                        <span className="text-xs text-gray-500">Floor {flat.floor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 font-medium ${(flat._count?.users || 0) === 0 ? 'text-gray-500 opacity-50' : 'text-blue-400'}`}>
                        <span className="material-symbols-outlined text-sm flex items-center">{(flat._count?.users || 0) === 0 ? 'group_off' : 'group'}</span> {flat._count?.users || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${(flat._count?.users || 0) > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {(flat._count?.users || 0) > 0 ? 'Occupied' : 'Available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditFlatId(flat.id);
                            setFlatId(flat.number);
                            setFloor(flat.floor);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(flat.id)}
                          className="p-1.5 rounded hover:bg-error/10 text-gray-400 hover:text-rose-500 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {flats.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium">No flats registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-morphism w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl bg-surface-container-low">
            <div className="p-6 border-b border-white/10 flex items-center justify-between font-headline">
              <h3 className="text-xl font-black text-white">{editFlatId ? 'Edit Flat' : 'Register New Flat'}</h3>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setEditFlatId(null);
                  setFlatId('');
                  setFloor(1);
                }} 
                className="material-symbols-outlined text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >close</button>
            </div>
            <div className="p-8">
              <form className="space-y-6 flex flex-col" onSubmit={handleSave}>
                <div className="flex gap-4">
                  <div className="space-y-2 flex-grow">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flat Identifier</label>
                    <input 
                      value={flatId}
                      onChange={(e) => setFlatId(e.target.value)}
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600" 
                      placeholder="e.g. D-504" 
                      type="text" 
                    />
                  </div>
                  <div className="space-y-2 w-28">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Floor</label>
                    <input 
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600 text-center"
                      type="number" 
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4 mt-8">
                  <button onClick={() => {
                    setModalOpen(false);
                    setEditFlatId(null);
                    setFlatId('');
                    setFloor(1);
                  }} className="flex-1 py-3 px-4 rounded-lg font-bold text-gray-400 border border-white/10 bg-transparent hover:bg-white/5 transition-all cursor-pointer" type="button">Cancel</button>
                  <button disabled={!flatId.trim()} className="flex-1 py-3 px-4 rounded-lg font-bold bg-emerald-500 text-white border-none hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50" type="submit">
                    {editFlatId ? 'Save Changes' : 'Create Unit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
