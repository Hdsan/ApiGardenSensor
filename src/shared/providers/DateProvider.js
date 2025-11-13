import moment from 'moment-timezone';

export default class DateProvider {
  constructor(timezone = 'America/Sao_Paulo') {
    this.timezone = timezone;
  }

  now() {
    return moment().tz(this.timezone).toDate();
  }

  currentHour() {
    return moment().tz(this.timezone).hour();
  }
}
