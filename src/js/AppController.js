import Task from './Task';
import Storage from './Storage';
import columnCategories from './constants';

export default class AppController {
  constructor() {
    this.board = document.querySelector('.board');
    this.todo = this.board.querySelector('.board-column__tasks.todo');
    this.inProgress = this.board.querySelector('.board-column__tasks.inProgress');
    this.done = this.board.querySelector('.board-column__tasks.done');

    this.column = null;
    this.form = null;
    this.item = null;
    this.ghostItem = null;
    this.storage = new Storage(JSON.parse(localStorage.getItem('state')));

    this.onAddCardClick = this.onAddCardClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
    this.onAddTaskClick = this.onAddTaskClick.bind(this);
    this.onDeleteTaskClick = this.onDeleteTaskClick.bind(this);
  }

  init() {
    const addCards = this.board.getElementsByClassName('task-item__add');
    Array.from(addCards).forEach((elm) => { elm.addEventListener('click', this.onAddCardClick); });

    this.loadFromStorage();
    this.refreshListeners();
  }

  // load
  loadFromStorage() {
    if (localStorage.getItem('state')) {
      Object.entries(this.storage.state).forEach(([k, v]) => {
        Array.from(v).forEach((task) => {
          const retrivedTask = new Task(k, ...Object.values({ ...task }));
          this[k].appendChild(retrivedTask.getTaskItem());
        });
      });
    }
  }

  refreshListeners() {
    const deleteTaskBtns = this.board.querySelectorAll('.task-item__delete');
    Array.from(deleteTaskBtns).forEach((elm) => elm.addEventListener('click', this.onDeleteTaskClick));

    Array.from(this.board.querySelectorAll('.board-column__tasks')).forEach((elm) => {
      elm.addEventListener('mousedown', this.onMouseDown);
    });
  }

  onAddCardClick(e) {
    if (this.form) { this.formRemove(); }

    const curTarget = e.currentTarget;
    this.column = curTarget.closest('.board-column');
    curTarget.classList.add('hidden');
    this.addFormNewTask();

    const addFormBtnAdd = this.column.querySelector('.add-btn');
    const addFormBtnCancel = this.column.querySelector('.delete-btn');

    addFormBtnCancel.addEventListener('click', this.onCancelClick);
    addFormBtnAdd.addEventListener('click', this.onAddTaskClick);
  }

  onDeleteTaskClick(e) {
    e.preventDefault();
    const curTarget = e.target;
    this.column = curTarget.closest('.board-column');
    this.item = curTarget.closest('.task-item');
    this.delTask();
  }

  delTask() {
    if (this.item) {
      this.item.remove();
      const category = this.findCategory();
      const taskId = this.getItemId();
      this.storage.deleteTask(category, taskId);
    }
  }

  findCategory() {
    const tasksList = this.column.querySelector('ul');
    return Array.from(tasksList.classList).find((elm) => columnCategories.includes(elm));
  }

  onAddTaskClick(e) {
    e.preventDefault();
    const text = this.form.querySelector('.add-new-task__text').value;
    const tasksList = this.column.querySelector('ul');
    const category = this.findCategory();

    if (text) {
      const newtTaskId = this.getLatestTaskId() + 1;
      const task = new Task(category, newtTaskId, text);
      tasksList.appendChild(task.getTaskItem());
      this.formRemove();
      this.refreshListeners();
      this.storage.addTask(category, newtTaskId, text);
    }
  }

  formRemove() {
    this.form.remove();
    this.form = null;
    this.column.querySelector('.task-item__add').classList.remove('hidden');
  }

  onCancelClick(e) {
    e.preventDefault();
    this.formRemove();
  }

  addFormNewTask() {
    this.form = document.createElement('form');
    this.form.classList.add('add-new-task');
    this.form.name = 'newTask';
    this.form.novalidate = '';

    const inHtml = `
    <textarea class="add-new-task__text" name="newTaskText" placeholder="Enter a text for this card"></textarea>
    <div class="buttons-container">
      <button class="add-btn" type="submit">Add card</button>
      <button class="delete-btn" type="reset"></button>
    </div>
    `;

    this.form.innerHTML = inHtml;

    if (this.column) {
      this.column.appendChild(this.form);
    }
  }

  getLatestTaskId() {
    const { state } = this.storage;
    const allTaskIds = [].concat(...Object.values(state)).map((elm) => +elm.taskId);

    return (allTaskIds.length) ? Math.max(...allTaskIds) : 0;
  }

  onMouseDown = (e) => {
    e.preventDefault();
    const curTarget = e.target;
    if (curTarget.className === 'task-item__delete') { return; }

    this.column = curTarget.closest('.board-column');
    this.item = curTarget.closest('.task-item');

    this.itemSizes = this.item.getBoundingClientRect();
    this.itemElmX = this.itemSizes.left;
    this.itemElmY = this.itemSizes.top;

    this.ghostItem = this.item.cloneNode(true);
    this.ghostItem.classList.add('dragged');
    this.item.classList.add('colored');

    document.body.append(this.ghostItem);

    // document.body.querySelector('.dragged').style.cursor = 'grabbing';
    // this.ghostItem.classList.add('grabbing')
    // document.body.style.cursor = 'grabbing';

    this.ghostItem.style.height = `${this.itemSizes.height - 12}px`;
    this.ghostItem.style.width = `${this.itemSizes.width - 12}px`;
    this.ghostItem.style.left = `${this.itemElmX}px`;
    this.ghostItem.style.top = `${this.itemElmY - 10}px`;

    this.coordX = e.pageX - this.itemSizes.left;
    this.coordY = e.pageY - this.itemSizes.top;

    document.documentElement.addEventListener('mouseup', this.onMouseUp);
    document.documentElement.addEventListener('mousemove', this.onMouseMove);
  };

  onMouseMove = (e) => {
    e.preventDefault();

    if (this.item) {
      this.ghostItem.style.top = `${e.pageY - this.coordY - 12}px`;
      this.ghostItem.style.left = `${e.pageX - this.coordX}px`;

      const elmUnderGhost = e.target;
      const elmUnderGhostRect = elmUnderGhost.getBoundingClientRect();

      if (!elmUnderGhost.closest('.board')) return;

      if (e.pageY === elmUnderGhostRect.top + elmUnderGhostRect.height / 2) return;

      if (elmUnderGhost.tagName === 'UL') {
        if (e.clientY < elmUnderGhostRect.top + elmUnderGhostRect.height / 2) {
          elmUnderGhost.prepend(this.item);
        } else {
          elmUnderGhost.append(this.item);
        }
      }

      if (elmUnderGhost.tagName === 'LI') {
        if (e.clientY < elmUnderGhostRect.top + elmUnderGhostRect.height / 2) {
          elmUnderGhost.before(this.item);
        } else {
          elmUnderGhost.after(this.item);
        }
      }
    }
  };

  onMouseUp = (e) => {
    e.preventDefault();

    if (this.item) {
      if (!e.target.closest('.board-column')) {
        this.clearDragged();
        return;
      }

      this.rewriteStorage(e.target);

      this.clearDragged();
    }
  };

  clearDragged() {
    this.ghostItem.removeAttribute('style');
    this.ghostItem.classList.remove('dragged');
    this.item.classList.remove('colored');

    document.body.style.cursor = 'auto';
    this.ghostItem.remove();
    this.item = null;
    this.ghostItem = null;
    document.documentElement.removeEventListener('mousemove', this.onMouseMove);
    document.documentElement.removeEventListener('mouseup', this.onMouseUp);
  }

  getItemId() {
    return +this.item.getAttribute('taskId');
  }

  rewriteStorage(target) {
    const prevTaskId = this.getItemId();
    this.storage.deleteTask(this.findCategory(), prevTaskId);

    this.column = target.closest('.board-column');
    const newCategory = this.findCategory();
    const text = this.item.querySelector('.task-item_text').innerText;
    this.storage.addTask(newCategory, prevTaskId, text);
    this.storage.refreshByCategory(newCategory, this.column);
  }
}
