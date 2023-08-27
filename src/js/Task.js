export default class Task {
  constructor(belongTo, taskId, text) {
    this.taskId = taskId;
    this.belongTo = belongTo;
    this.text = text;
  }

  getTaskItem() {
    const li = document.createElement('li');
    li.classList.add('task-item');
    li.setAttribute('taskId', String(this.taskId));
    const html = `
      <div class="task-item_text">${this.text}</div>
      <div class="task-item__delete"></div>
    `;
    li.innerHTML = html;
    return li;
  }
}
