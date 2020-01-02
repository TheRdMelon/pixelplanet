/*
 * save the chat history
 */

class ChatHistory {
  OP_CODE = 0xA5;
  history: Array;

  constructor() {
    this.history = [];
  }

  addMessage(name, message) {
    if (this.history.length > 20) {
      this.history.shift();
    }
    this.history.push([name, message]);
  }
}

const chatHistory = new ChatHistory();
export default chatHistory;
