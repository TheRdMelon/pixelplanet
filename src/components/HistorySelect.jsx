/*
 * LogIn Form
 * @flow
 */
import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import { selectHistoricalTime } from '../actions';

function dateToString(date) {
  // YYYY-MM-DD
  const timeString = date.substr(0, 4) + date.substr(5, 2) + date.substr(8, 2);
  return timeString;
}

async function getTimes(day, canvasId) {
  try {
    const response = await fetch(`./api/history?day=${day}&id=${canvasId}`);
    if (response.status !== 200) {
      return [];
    }
    const times = await response.json();
    const parsedTimes = times.map((a) => `${a.substr(0, 2)}:${a.substr(-2, 2)}`);
    return parsedTimes;
  } catch {
    return [];
  }
}

class HistorySelect extends React.Component {
  constructor() {
    super();

    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    if (month < 10) month = `0${month}`;
    if (day < 10) day = `0${day}`;
    const max = `${date.getFullYear()}-${month}-${day}`;

    this.state = {
      submitting: false,
      selectedDate: new Date(),
      max,
    };

    this.handleDateChange = this.handleDateChange.bind(this);
  }

  async handleDateChange(evt) {
    const {
      submitting,
    } = this.state;

    if (submitting) {
      return;
    }

    this.setState({
      submitting: true,
    });
    const {
      canvasId,
      setTime,
    } = this.props;
    const date = dateToString(evt.target.value);
    const times = await getTimes(date, canvasId);
    if (times.length > 0) {
      setTime(date, times[0]);
    }
    this.setState({
      submitting: false,
      selectedDate: date,
      times,
    });
  }

  render() {
    const {
      setTime,
    } = this.props;
    const {
      submitting,
      times,
      selectedDate,
      max,
    } = this.state;
    return (
      <div id="historyselect">
        <input
          type="date"
          requiredPattern="\d{4}-\d{2}-\d{2}"
          min="2020-01-08"
          max={max}
          onChange={this.handleDateChange}
        />
        <div>
          { (times && times.length > 0)
            ? (
              <select onChange={(evt) => setTime(selectedDate, evt.target.value)}>
                {times.map((value) => (
                  <option value={value}>{value}</option>
                ))}
              </select>
            )
            : <p>Select Date</p> }
          { (submitting) ? <p>Loading...</p> : null }
        </div>
      </div>
    );
  }
}


function mapDispatchToProps(dispatch) {
  return {
    setTime(date: string, time: string) {
      const timeString = time.substr(0, 2) + time.substr(-2, 2);
      dispatch(selectHistoricalTime(date, timeString));
    },
  };
}

function mapStateToProps(state: State) {
  const {
    canvasId,
  } = state.canvas;
  return { canvasId };
}

export default connect(mapStateToProps, mapDispatchToProps)(HistorySelect);
