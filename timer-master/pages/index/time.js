const AV = require('../../../utils/av-live-query-weapp-min.js');

class time extends AV.Object {
  get done() {
    return this.get('done');
  }
  set done(value) {
    this.set('done', value);
  }

  get content() {
    return this.get('content');
  }
  set content(value) {
    this.set('content', value);
  }
  set name(value) {
    this.set('name', value);
  }


}

AV.Object.register(time, 'time');

module.exports = time;