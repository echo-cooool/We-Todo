const AV = require('../../utils/av-live-query-weapp-min');
const Todo = require('../../model/todo');
const Done = require('../../model/done');
const bind = require('../../utils/live-query-binding');
const app = getApp()


Page({

  onShareAppMessage: function () {
    return {
      title: 'Todo-List',
      desc: '最简单高效的Todo-List',
      path: 'pages/todos/todos'
    }
  },
  data: {
    formid: null,
    formdata: null,
    remind: '加载中',
    todos: [],
    editedTodo: {},
    draft: '',
    editDraft: null,
  },
  login: function () {
    var _this = this;
    const user = AV.User.current();
    return AV.Promise.resolve(AV.User.current()).then(user =>
      user ? (user.isAuthenticated().then(authed => authed ? user : null)) : null
    ).then(user => user ? user : AV.User.loginWithWeapp()).catch(error => console.error(error.message));
    setTimeout(function () {
      _this.setData({
        remind: ''
      });

    }, 100);
  },

  fetchTodos: function (user) {

    wx.showToast({
      title: '加载中',
      icon: 'loading'
    });
    var _this = this;
    setTimeout(function () {
      _this.setData({
        remind: '加载中'
      });
    }, 100);
    console.log('uid', user.id);
    console.log('user', user);
    const query = new AV.Query(Todo)
      .equalTo('user', AV.Object.createWithoutData('User', user.id))
      .descending('createdAt');

    const setTodos = this.setTodos.bind(this);
    return AV.Promise.all([query.find().then(setTodos), query.subscribe()]).then(([todos, subscription]) => {
      this.subscription = subscription;
      if (this.unbind) this.unbind();
      this.unbind = bind(subscription, todos, setTodos);
    }).catch(error => console.error(error.message));
    setTimeout(function () {
      _this.setData({
        remind: ''
      });
    }, 100);
    wx.hideToast();
  },
  onReady: function () {
    console.log('page ready');
    this.login().then(this.fetchTodos.bind(this)).catch(error => console.error(error.message));
  },
  onUnload: function () {
    this.subscription.unsubscribe();
    this.unbind();
  },
  onPullDownRefresh: function () {
    const user = AV.User.current();
    if (!user) return wx.stopPullDownRefresh();
    this.fetchTodos(user).catch(error => console.error(error.message)).then(wx.stopPullDownRefresh);
  },
  setTodos: function (todos) {
    const user = AV.User.current();
    const activeTodos = todos.filter(todo => !todo.done);
    this.setData({
      todos,
      activeTodos,
    });
    console.log(todos)
    return todos;
  },
  updateDraft: function ({
    detail: {
      value
    }
  }) {
    // Android 真机上会诡异地触发多次时 value 为空的事件
    if (!value) return;
    this.setData({
      draft: value
    });
  },

  addTodo: function (res) {
    console.log(res)
    const user = AV.User.current();
    wx.showToast({
      title: '添加中……',
      icon: 'loading'
    });
    var value = this.data.draft && this.data.draft.trim()
    if (!value) {
      wx.showToast({
        title: '您没有输入哦~',
      })
      return;
    }
    var acl = new AV.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(AV.User.current(), true);
    acl.setWriteAccess(AV.User.current(), true);
    new Todo({
      content: value,
      done: false,
      user: AV.User.current(),
      openid: app._user.openid,
      sent: 0,
      name2: app._user.wx.nickName,
      userdata: app._user.wx,
    }).setACL(acl).save().then((todo) => {
      this.setTodos([todo, ...this.data.todos]);
    })
    this.setData({
      draft: ''
    });
    if (!user) return wx.stopPullDownRefresh();
    this.fetchTodos(user).catch(error => console.error(error.message)).then(wx.stopPullDownRefresh);
    wx.hideToast();
    new Done({
      content: value,
      done: false,
      user: AV.User.current(),
      openid: app._user.openid,
      sent: 0,
      name2: app._user.wx.nickName,
      userdata: app._user.wx,
    }).setACL(acl).save() 

  },

  toggleDone: function ({
    target: {
      dataset: {
        id
      }
    }
  }) {
    wx.showToast({
      title: '添加中……',
      icon: 'loading'
    });
    const {
      todos
    } = this.data;
    const currentTodo = todos.filter(todo => todo.id === id)[0];
    currentTodo.done = !currentTodo.done;
    currentTodo.save()
      .then(() => this.setTodos(todos))
      ;
    wx.hideToast();
  },
  editTodo: function ({
    target: {
      dataset: {
        id
      }
    }
  }) {
    this.setData({
      editDraft: null,
      editedTodo: this.data.todos.filter(todo => todo.id === id)[0] || {}
    });
  },
  updateEditedContent: function ({
    detail: {
      value
    }
  }) {
    this.setData({
      editDraft: value
    });
  },
  doneEdit: function ({
    target: {
      dataset: {
        id
      }
    }
  }) {
    wx.showToast({
      title: '添加中……',
      icon: 'loading'
    });
    const {
      todos,
      editDraft
    } = this.data;
    this.setData({
      editedTodo: {},
    });

    if (editDraft === null) return;
    const currentTodo = todos.filter(todo => todo.id === id)[0];
    if (editDraft === currentTodo.content) return;
    currentTodo.content = editDraft;
    currentTodo.save().then(() => {
      this.setTodos(todos);
    }).catch(error => console.error(error.message));
    wx.hideToast();
  },
  removeDone: function () {
    wx.showToast({
      title: '删除中',
      icon: 'loading'
    });
    AV.Object.destroyAll(this.data.todos.filter(todo => todo.done)).then(() => {
      this.setTodos(this.data.activeTodos);
    }).catch(error => console.error(error.message));
    wx.hideToast();
  },



});