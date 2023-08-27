export default class Storage {
  constructor(state) {
    this.state = state || {
      todo: [],
      inProgress: [],
      done: [],
    };
  }

  addTask(belongTo, taskId, text) {
    this.state[belongTo].push({ taskId, text });
    this.updateStorage();
    return taskId;
  }

  deleteTask(belongTo, taskId) {
    this.state[belongTo] = this.state[belongTo].filter((task) => task.taskId !== taskId);
    this.updateStorage();
  }

  refreshByCategory(category, column) {
    this.state[category] = Array.from(column.querySelectorAll('.task-item')).map((elm) => {
      const taskId = +elm.getAttribute('taskId');
      const text = elm.querySelector('.task-item_text').innerText;
      return { taskId, text };
    });
    this.updateStorage();
  }

  updateStorage() {
    localStorage.setItem('state', JSON.stringify(this.state));
  }
}
