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
  // YYYYMMDD
  return timeString;
}

async function getTimes(day, canvasId) {
  try {
    const response = await fetch(`./api/history?day=${day}&id=${canvasId}`);
    if (response.status !== 200) {
      return [];
    }
    const times = await response.json();
    const parsedTimes = times
      .map((a) => `${a.substr(0, 2)}:${a.substr(-2, 2)}`);
    return [
      '00:00',
      ...parsedTimes,
    ];
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
      selectedDate: null,
      selectedTime: null,
      max,
    };
    this.dateSelect = null;

    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.changeTime = this.changeTime.bind(this);
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
      times: [],
      selectedTime: null,
    });
    const {
      canvasId,
      setTime,
    } = this.props;
    const date = dateToString(evt.target.value);
    const times = await getTimes(date, canvasId);
    if (times.length === 0) {
      this.setState({
        submitting: false,
        selectedDate: null,
      });
      return;
    }
    setTime(date, times[0]);
    this.setState({
      submitting: false,
      selectedDate: date,
      selectedTime: (times) ? times[0] : null,
      times,
    });
  }

  handleTimeChange(evt) {
    const {
      setTime,
    } = this.props;
    const {
      selectedDate,
    } = this.state;

    const selectedTime = evt.target.value;
    this.setState({
      selectedTime,
    });
    setTime(selectedDate, selectedTime);
  }

  async changeTime(diff) {
    let {
      times,
      selectedDate,
      selectedTime,
    } = this.state;
    if (!selectedTime || times.length === 0) {
      return;
    }
    const {
      setTime,
      canvasId,
    } = this.props;

    let newPos = times.indexOf(selectedTime) + diff;
    if (newPos >= times.length || newPos < 0) {
      if (newPos < 0) {
        this.dateSelect.stepDown(1);
      } else {
        this.dateSelect.stepUp(1);
      }
      selectedDate = dateToString(this.dateSelect.value);
      this.setState({
        submitting: true,
        times: [],
        selectedTime: null,
      });
      times = await getTimes(selectedDate, canvasId);
      if (times.length === 0) {
        this.setState({
          submitting: false,
          selectedDate: null,
        });
        return;
      }
      this.setState({
        submitting: false,
        selectedDate,
      });
      newPos = (newPos < 0) ? (times.length - 1) : 0;
    }

    selectedTime = times[newPos];
    this.setState({
      times,
      selectedTime,
    });
    setTime(selectedDate, selectedTime);
  }

  render() {
    const {
      canvasStartDate,
    } = this.props;
    const {
      submitting,
      times,
      selectedDate,
      selectedTime,
      max,
    } = this.state;
    return (
      <div id="historyselect">
        <input
          type="date"
          requiredPattern="\d{4}-\d{2}-\d{2}"
          min={canvasStartDate}
          max={max}
          ref={(ref) => { this.dateSelect = ref; }}
          onChange={this.handleDateChange}
        />
        <div>
          { (selectedTime)
            ? (
              <div>
                <button
                  type="button"
                  className="hsar"
                  onClick={() => this.changeTime(-1)}
                >←</button>
                <select
                  value={selectedTime}
                  onChange={this.handleTimeChange}
                >
                  {times.map((value) => (
                    <option value={value}>{value}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="hsar"
                  onClick={() => this.changeTime(+1)}
                >→</button>
              </div>
            )
            : null }
          { (submitting) ? <p>Loading...</p> : null }
          { (!selectedDate && !submitting) ? <p>Select Date above</p> : null }
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
    canvasStartDate,
  } = state.canvas;
  return { canvasId, canvasStartDate };
}

export default connect(mapStateToProps, mapDispatchToProps)(HistorySelect);
