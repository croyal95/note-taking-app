// App management
const state = {
    folders: [],
    currentFolder: sessionStorage.getItem('currentFolder'),
    notes: [],
    currentNote: null,
    theme: localStorage.getItem('theme') || 'light',
  };
  
  // Constants
  const API_BASE_URL = 'http://127.0.0.1:3000';
  const PROTECTED_ROUTES = ['notes.html'];
  
  // DOM Elements
  const elements = {
      themeToggle: document.getElementById('theme-toggle'),
      folderList: document.getElementById('folder-list'),
      newFolderBtn: document.getElementById('new-folder-btn'),
      newFolderInput: document.getElementById('new-folder-input'),
      newFolderForm: document.getElementById('new-folder-form'),
      cancelFolderBtn: document.getElementById('cancel-folder'),
      notesContainer: document.getElementById('notes-list'),
      noteTitle: document.getElementById('note-title'),
      noteBody: document.getElementById('note-body'),
      saveNoteBtn: document.getElementById('save-note-btn'),
      newNoteBtn: document.getElementById('new-note-btn'),
      
  };
  
  // API service
  const api = {
    async request(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'http://127.0.0.1:5500'
            },
            credentials: 'include'
        };
  
        if (body && !(body instanceof FormData)) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        } else if (body instanceof FormData) {
            options.body = body;
        }
        
        const apiEndpoint = endpoint.startsWith('api/') ? endpoint : `api/${endpoint}`;
        try {
          const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`, options);
          const data = await response.json();
          return data;
      } catch (error) {
          this.handleError(error);
          throw error;
      }
  },
  
  handleUnauthorized() {
      window.location.href = 'http://127.0.0.1:5500/public/index.html?message=Session expired. Please log in again.';
  },
  
  handleError(error) {
      console.error('API Error:', error);
      notifications.show('error', error.message || 'An error occurred');
  }
  };
  
  // Theme management
  document.addEventListener('DOMContentLoaded', () => {
      const themeToggle = document.getElementById('theme-toggle');
      
      if (themeToggle) {
          const currentTheme = localStorage.getItem('theme') || 'light';
          document.body.classList.toggle('dark-theme', currentTheme === 'dark');
          themeToggle.checked = currentTheme === 'dark';
  
          themeToggle.addEventListener('change', (e) => {
              document.body.classList.toggle('dark-theme', e.target.checked);
              localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
          });
      }
  
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
          document.body.classList.add('dark-theme');
      }
  });
  
  // Folder management
  const folderManager = {
      async fetchFolders() {
          try {
              const response = await fetch('http://127.0.0.1:3000/api/folders', {
                  method: 'GET',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  credentials: 'include'
              });
              
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const folders = await response.json();
              state.folders = Array.isArray(folders) ? folders : [];
              this.renderFolders();
              
              return folders;
          } catch (error) {
              console.error('Error fetching folders:', error);
              notifications.show('error', 'Failed to load folders');
              return [];
          }
      },
          
      renderFolders() {
          const folderList = document.getElementById('folder-list');
          if (!folderList) {
              console.error('Folder list element not found');
              return;
          }

          folderList.innerHTML = '';
          
          if (!Array.isArray(state.folders) || state.folders.length === 0) {
              const emptyState = document.createElement('li');
              emptyState.className = 'folder-empty-state';
              emptyState.textContent = 'No folders yet';
              folderList.appendChild(emptyState);
              return;
          }
          
          // Render each folder
          state.folders.forEach(folder => {
              const folderItem = document.createElement('li');
              folderItem.className = 'folder-item';
              folderItem.dataset.folderId = folder._id;
              
              folderItem.innerHTML = `
                  <button class="folder-button">
                      <svg class="folder-icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                      </svg>
                      <span class="folder-name">${folder.name}</span>
                  </button>
                  <button class="folder-menu-button" aria-label="Folder options">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                  </button>
              `;
              
              // Add click handlers
              const folderButton = folderItem.querySelector('.folder-button');
              const menuButton = folderItem.querySelector('.folder-menu-button');
              
              if (folderButton) {
                folderButton.addEventListener('click', () => {
                    state.currentFolder = folder._id;
                    this.updateActiveFolderUI(folder._id);
                    noteManager.loadNotes(folder._id);
                });
              }
              
              if (menuButton) {
                  menuButton.addEventListener('click', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.showFolderMenu(folder, menuButton);
                  });
              }
              
              folderList.appendChild(folderItem);
          });
      },
  
      updateActiveFolderUI(folderId) {
          document.querySelectorAll('.folder-item').forEach(item => {
              item.classList.toggle('active', item.dataset.folderId === folderId);
          });
      },
  
      showFolderMenu(folder, menuButton) {
          const existingMenu = document.querySelector('.folder-context-menu');
          if (existingMenu) {
              existingMenu.remove();
          }
  
          const menu = document.createElement('div');
          menu.className = 'folder-context-menu';
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'menu-option delete-option';
          deleteBtn.textContent = 'Delete';
          deleteBtn.onclick = async (e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
                  try {
                      await this.deleteFolder(folder);
                      menu.remove();
                  } catch (error) {
                      menu.remove();
                  }
              } else {
                  menu.remove();
              }
          };
  
          menu.appendChild(deleteBtn);
  
          const rect = menuButton.getBoundingClientRect();
          menu.style.position = 'absolute';
          menu.style.top = `${rect.bottom + window.scrollY}px`;
          menu.style.left = `${rect.left + window.scrollX}px`;
  
          document.body.appendChild(menu);
  
          const closeMenu = (e) => {
              if (!menu.contains(e.target) && e.target !== menuButton) {
                  menu.remove();
                  document.removeEventListener('click', closeMenu);
              }
          };
          
          setTimeout(() => {
              document.addEventListener('click', closeMenu);
          }, 0);
      },
  
      async deleteFolder(folder) {
          try {
              const response = await api.request(`folders/${folder._id}`, 'DELETE');
              if (response.success) {
                  state.folders = state.folders.filter(f => f._id !== folder._id);
                  if (state.currentFolder === folder._id) {
                      state.currentFolder = null;
                  }
                  this.renderFolders();
                  notifications.show('success', 'Folder deleted successfully');
              }
          } catch (error) {
              console.error('Error deleting folder:', error);
              notifications.show('error', 'Failed to delete folder');
              throw error;
          }
      },
  
    updateActiveFolderUI(folderId) {
        document.querySelectorAll('.folder-button').forEach(button => {
            button.classList.toggle('active', button.dataset.folderId === folderId);
        });
    },
  
    updateState(folders) {
      state.folders = folders;
    }
  };
  
  // Note management
  const noteManager = {
    async loadNotes(folderId) {
        try {
            const notesContainer = document.getElementById('notes-list');
            if (notesContainer) {
                notesContainer.innerHTML = '';
            }
    
            const notes = await api.request('notes');
            state.notes = notes || [];

            const displayNotes = folderId ? 
                notes.filter(note => String(note.folder?._id) === String(folderId)) : 
                notes;
    
            this.renderNotes(displayNotes);
        } catch (error) {
            console.error('Error loading notes:', error);
            notifications.show('error', 'Failed to load notes');
        }
    },
  
      renderNotes(notesToRender) {
          const notesContainer = document.getElementById('notes-list');
          if (!notesContainer) {
            notesContainer.innerHTML = '';
          }
  
          if (!notesToRender || notesToRender.length === 0) {
              const emptyMessage = document.createElement('div');
              emptyMessage.className = 'empty-notes-message';
              emptyMessage.textContent = state.currentFolder ? 
                  'No notes in this folder yet. Create one!' : 
                  'No notes yet. Create one!';
              notesContainer.appendChild(emptyMessage);
              return;
          }
  
          // Sort notes by last updated
          const sortedNotes = [...notesToRender].sort((a, b) => 
              new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
          );
  
          sortedNotes.forEach(note => {
              const noteElement = document.createElement('div');
              noteElement.className = 'note-item';
              noteElement.dataset.noteId = note._id;
              noteElement.dataset.folderId = note.folder?._id || note.folder || '';
              
              noteElement.innerHTML = `
                  <div class="note-preview">
                      <h3 class="note-title">${note.title || 'Untitled Note'}</h3>
                      <p class="note-excerpt">${this.createExcerpt(note.body || '')}</p>
                      <p class="note-meta">
                      ${new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                      ${note.folder?.name ? `<span class="folder-tag">${note.folder.name}</span>` : ''}
                      </p>
                  </div>
                  <div class="note-actions">
                      <button class="delete-btn" aria-label="Delete note">❌</button>
                  </div>
              `;
  
              noteElement.querySelector('.note-preview').addEventListener('click', () => {
                  this.editNote(note);
              });
  
              noteElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                  e.stopPropagation();
                  this.deleteNote(note._id);
              });
  
              notesContainer.appendChild(noteElement);
          });
      },
  
      async saveNote() {
        try {
            const titleElement = document.getElementById('note-title');
            const bodyElement = document.getElementById('note-body');
            const saveButton = document.getElementById('save-note-btn');
    
            const noteData = {
                title: titleElement.textContent.trim() || 'Untitled Note',
                body: bodyElement.value.trim(),
                folder: state.currentFolder 
            };
    
            const noteId = saveButton.dataset.noteId;
            const method = noteId ? 'PUT' : 'POST';
            const endpoint = noteId ? `notes/${noteId}` : 'notes';
    
            const savedNote = await api.request(endpoint, method, noteData);
    
            saveButton.dataset.noteId = savedNote._id;
            await this.loadNotes(state.currentFolder);
            notifications.show('success', 'Note saved successfully');
    
        } catch (error) {
            console.error('Error saving note:', error);
            notifications.show('error', 'Failed to save note');
        }
    },
  
  editNote(note) {
      const titleElement = document.getElementById('note-title');
      const bodyElement = document.getElementById('note-body');
      const saveButton = document.getElementById('save-note-btn');

  
      if (titleElement && bodyElement && saveButton) {
          titleElement.textContent = note.title || 'Untitled Note';
          bodyElement.value = note.body || '';
          state.currentNote = note;
          saveButton.dataset.noteId = note._id;
      }
  },
  
  createExcerpt(text, length = 100) {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
  },
  
  async deleteNote(noteId) {
          if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
              return;
          }
      
          try {
              const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
                  method: 'DELETE',
                  credentials: 'include',
                  headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Origin': 'http://127.0.0.1:5500'
                  }
              });
      
              const data = await response.json();
      
              if (response.ok) {
                  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
                  if (noteElement) {
                      noteElement.remove();
                  }

          state.notes = state.notes.filter(note => note._id !== noteId);
                  
                  // Re-render notes for current folder
                  const displayNotes = state.currentFolder ?
                      state.notes.filter(note => 
                          note.folder?._id === state.currentFolder || 
                          note.folder === state.currentFolder
                      ) :
                      state.notes;
                  
                  this.renderNotes(displayNotes);
          notifications.show('success', 'Note deleted successfully');
              } else {
                  throw new Error(data.message || 'Failed to delete note');
              }
      } catch (error) {
          console.error('Error deleting note:', error);
              notifications.show('error', error.message || 'Failed to delete note');
          }
      }
  }   
  
  // Notifications
  const notifications = {
    show(type, message, duration = 3000) {
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification-${type}`);
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
  };
  
  // Event Handlers
  document.addEventListener('DOMContentLoaded', async () => {
      
      Object.entries(elements).forEach(([key, element]) => {
          console.log(`Element ${key}:`, element);
      });
  
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const notesSidebar = document.querySelector('.notes-sidebar');

  
  if (menuToggle && sidebar && notesSidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-active');
        notesSidebar.classList.toggle('notes-sidebar-active');
        menuToggle.setAttribute('aria-expanded', 
           sidebar.classList.contains('sidebar-active').toString());
    });
   }
  
  // Close sidebar when clicking outside 
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && 
    !notesSidebar.contains(e.target) && 
    !menuToggle.contains(e.target)) {
    sidebar.classList.remove('sidebar-active');
    notesSidebar.classList.remove('notes-sidebar-active');
    menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
  
      const newFolderBtn = document.getElementById('new-folder-btn');
      const newFolderForm = document.getElementById('new-folder-form');
      const newFolderInput = document.getElementById('new-folder-input');
      const cancelFolderBtn = document.getElementById('cancel-folder');
  
      if (newFolderBtn) {
          newFolderBtn.addEventListener('click', () => {
              const folderCreation = document.querySelector('.folder-creation');
              if (folderCreation) {
                  folderCreation.hidden = false;
                  newFolderInput?.focus();
              }
          });
      }
  
      if (newFolderForm) {
          newFolderForm.addEventListener('submit', async (e) => {
              e.preventDefault();
                  
              const folderName = newFolderInput.value.trim();
              if (!folderName) return;
      
              try {
                  const response = await fetch('http://127.0.0.1:3000/api/folders', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      credentials: 'include',
                      body: JSON.stringify({ name: folderName })
                  });
      
                  const data = await response.json();
                  
                  if (response.ok) {
                      newFolderInput.value = '';
                      document.querySelector('.folder-creation').hidden = true;
                      
                      await folderManager.fetchFolders();
                  } else {
                      showError(data.message || 'Failed to create folder');
                  }
              } catch (error) {
                  showError('Network error. Please try again.');
              }
          });
      }
  
      if (cancelFolderBtn) {
          cancelFolderBtn.addEventListener('click', () => {
              const folderCreation = document.querySelector('.folder-creation');
              if (folderCreation) {
                  folderCreation.hidden = true;
                  newFolderInput.value = '';
              }
          });
      }

      if (elements.newNoteBtn) {
        elements.newNoteBtn.addEventListener('click', () => {
            const titleElement = document.getElementById('note-title');
            if (titleElement) {
                // Clear existing note content
                titleElement.textContent = 'Untitled Note';
                document.getElementById('note-body').value = '';
                document.getElementById('save-note-btn').dataset.noteId = '';

                 // Close sidebars
            const sidebar = document.querySelector('.sidebar');
            const notesSidebar = document.querySelector('.notes-sidebar');
            const menuToggle = document.getElementById('menu-toggle');
            
            if (sidebar && notesSidebar && menuToggle) {
                sidebar.classList.remove('sidebar-active');
                notesSidebar.classList.remove('notes-sidebar-active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
    
                // Focus the title and select text
                titleElement.focus();
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(titleElement);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }
  
      if (elements.saveNoteBtn) {
          elements.saveNoteBtn.addEventListener('click', async () => {
          await noteManager.saveNote();
          });
      }
  
    // Initialize note autosave
    const noteBody = document.getElementById('note-body');
    if (noteBody) {
        let autosaveTimeout;
        noteBody.addEventListener('input', () => {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = setTimeout(() => {
                if (noteBody.value.trim()) {
                    noteManager.saveNote();
                }
            }, 1000);
        });
    }
  
  // Authentication Check
  const authCheck = {
      async verifySession() {
          try {
              const response = await fetch(`${API_BASE_URL}/api/auth/verify-session`, {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Origin': 'http://127.0.0.1:5500'
                  }
              });
  
              const data = await response.json();
  
              if (!response.ok || !data.success) {
                  return false;
              }
              return true;
  
          } catch (error) {
              console.error('Session verification error:', error);
          }
      
      // Check sessionStorage as fallback
      const isSessionActive = sessionStorage.getItem('sessionActive') === 'true';
      const user = sessionStorage.getItem('user');
      
      if (isSessionActive && user) {
          return true;
      }
  
      window.location.href = 'http://127.0.0.1:5500/public/index.html';
      return false;
  }
  }; 
  
  
  // Initialize app 
  async function initializeApp() {
      if (window.location.pathname.endsWith('notes.html')) {
          const isAuthenticated = await authCheck.verifySession();
          
          if (!isAuthenticated) {
              window.location.href = 'http://127.0.0.1:5500/public/index.html';
              return;
          }
  
          await folderManager.fetchFolders();
          const savedFolderId = sessionStorage.getItem('currentFolder');
          if (savedFolderId) {
              state.currentFolder = savedFolderId;
              folderManager.updateActiveFolderUI(savedFolderId);
              await noteManager.loadNotes(savedFolderId);
          } else {
              await noteManager.loadNotes(); // Load all notes if no folder is selected
          }
      }
  }
  
      initializeApp().catch(error => {
          notifications.show('error', 'Failed to initialize application');
      });
    });