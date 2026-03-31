"use client";

import { getAllUsers } from "@/services/dashboard/AdminStats";
import { deleteUser } from "@/services/UserApi";
import { Search, Trash2, UserRoundPen } from "lucide-react";
import React, { useEffect, useState } from "react";
import UserModal from "@/components/dashboard/UserModal";

function UsersPage() {
  const [users, setUsers] = useState();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    getAllUsers()
      .then((res) => {
        if (res.ok) {
          const filterUsers = res.data?.filter(
            (user) => user.role !== "admin",
          );
          setUsers(filterUsers || []);
        } else {
          console.error(res.message);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users?.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  });

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white p-5 rounded-2xl">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Manage Users</h2>
            <div className="flex flex-1 md:max-w-md items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3aff]/20 focus:border-[#1a3aff] transition-all duration-200 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-(--accent) text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-(--accent-2) hover:bg-(--accent-2) transition-all duration-200 whitespace-nowrap"
              >
                Add User
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {filteredUsers?.length <= 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
              </div>
            ) : (
              filteredUsers?.map((user) => (
              <div
                key={user.id}
                className="flex justify-between border border-gray-200 p-2 rounded-lg px-4 py-2 hover:shadow-md hover:border-[#1a3aff]/20 hover:shadow-[#1a3aff]/20 transition-all duration-200"
              >
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500 capitalize px-2">
                    {user.role}
                  </div>
                  <div
                    className="cursor-pointer p-1 rounded hover:scale-110 transition-all duration-200"
                    onClick={() => setEditingUser(user)}
                  >
                    <UserRoundPen className="text-blue-500" size={20} />
                  </div>
                  <div 
                    className="cursor-pointer p-1 rounded hover:scale-110 transition-all duration-200"
                    onClick={() => setConfirmDelete(user.id)}
                  >
                    <Trash2 className="text-red-500" size={20} />
                  </div>

                  {confirmDelete === user.id && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                      <div className="bg-white w-full max-w-sm p-5 rounded-2xl animate-fadeUp">
                        <h2 className="text-xl font-bold mb-2">Confirm Delete</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this user?</p>
                        <div className="flex gap-3 justify-end">
                          <button
                            type="button"
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600 transition-all duration-200"
                            onClick={() => {
                              deleteUser(user.id)
                                .then((data) => {
                                  console.log(data);
                                  setConfirmDelete(null);
                                  fetchUsers();
                                })
                                .catch(console.error);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Modals placed outside mapping for performance and clean DOM tree */}
      {isAdding && (
        <UserModal 
          mode="add" 
          onClose={() => setIsAdding(false)} 
          onSuccess={() => { setIsAdding(false); fetchUsers(); }} 
        />
      )}

      {editingUser != null && (
        <UserModal 
          mode="edit" 
          initialData={editingUser}
          onClose={() => setEditingUser(null)} 
          onSuccess={() => { setEditingUser(null); fetchUsers(); }} 
        />
      )}

    </div>
  );
}

export default UsersPage;
