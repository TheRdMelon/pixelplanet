/*
 * rate limiter utils
 * @flow
 */


/*
 * RateLimiter
 * @param ticks_per_min How many ticks per min are allowed
 * @param burst Amount of ticks that are allowed before limiter kicks in
 * @param on_cooldown If we force to wait the whole burst time once the limit is reached
 */
class RateLimiter {
  ms_per_tick: number;
  burst_time: number;
  cooldown_completely: boolean;
  on_cooldown: boolean;
  wait: number;

  constructor(ticks_per_min = 20, burst = 20, cooldown_completely = false) {
    this.wait = Date.now();
    this.ms_per_tick = 60 / ticks_per_min * 1000;
    this.burst_time = burst * this.ms_per_tick;
    this.cooldown_completely = cooldown_completely;
    this.on_cooldown = false;
  }

  /*
   * return:
   *   false if rate limiter isn't hit
   *   waitingTime if rate limiter got hit
   */
  tick() {
    const now = Date.now();
    const waitLeft = this.wait - now;
    if (waitLeft >= this.burst_time) {
      this.on_cooldown = true;
      return waitLeft;
    }
    if (waitLeft > 0) {
      if (this.cooldown_completely && this.on_cooldown) {
        return waitLeft;
      }
      this.wait += this.ms_per_tick;
      return false;
    }
    this.wait = now + this.ms_per_tick;
    this.on_cooldown = false;
    return false;
  }
}

export default RateLimiter;
