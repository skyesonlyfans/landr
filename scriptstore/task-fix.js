// Name: Persistent Tasks
// Description: Saves your to-do list tasks so they remain after page refreshes.
// Author: Landr Addon

(function() {
  const TODO_STORAGE_KEY = 'landr_persistent_todos';

  // 1. Function to save current DOM state to LocalStorage
  function saveTodos() {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;

    const todos = [];
    const items = todoList.querySelectorAll('.todo-item');

    items.forEach(item => {
      const textSpan = item.querySelector('.todo-text');
      if (textSpan) {
        todos.push({
          text: textSpan.textContent,
          completed: item.classList.contains('completed')
        });
      }
    });

    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  }

  // 2. Function to load tasks from LocalStorage
  function loadTodos() {
    const stored = localStorage.getItem(TODO_STORAGE_KEY);
    if (!stored) return;

    try {
      const todos = JSON.parse(stored);
      const todoList = document.getElementById('todoList');
      
      // Clear list to prevent duplicates if script re-runs
      todoList.innerHTML = '';

      todos.forEach(todo => {
        const li = document.createElement('li');
        // Apply completed class if saved as such
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        // Reconstruct exact HTML structure from index.html
        li.innerHTML = `
            <span class="todo-text">${todo.text}</span>
            <button class="todo-btn complete-btn" onclick="toggleComplete(this)">✓</button>
            <button class="todo-btn delete-btn" onclick="deleteTodo(this)">✕</button>
        `;
        todoList.appendChild(li);
      });
      
      console.log(`Loaded ${todos.length} persistent tasks.`);
    } catch (e) {
      console.error('Error loading persistent todos', e);
    }
  }

  // 3. Hijack the LandrAPI.addTodo function
  if (typeof LandrAPI !== 'undefined') {
    const originalAddTodo = LandrAPI.addTodo;
    
    LandrAPI.addTodo = function(text) {
      // Call original function to update DOM
      originalAddTodo(text);
      // Save state immediately
      saveTodos();
    };
  }

  // 4. Hijack the global toggleComplete function
  // We need to do this because index.html uses inline onclick="toggleComplete(this)"
  const originalToggleComplete = window.toggleComplete;
  window.toggleComplete = function(btn) {
    originalToggleComplete(btn);
    saveTodos();
  };

  // 5. Hijack the global deleteTodo function
  const originalDeleteTodo = window.deleteTodo;
  window.deleteTodo = function(btn) {
    originalDeleteTodo(btn);
    
    // Original function has a 300ms animation (slideIn reverse) before removal.
    // We must wait for that to finish before saving, otherwise we save the item that is about to die.
    setTimeout(() => {
        saveTodos();
    }, 350); 
  };

  // Initialize
  loadTodos();
  
  if (typeof LandrAPI !== 'undefined') {
    LandrAPI.showNotification('Task persistence enabled', 'success');
  }

})();
