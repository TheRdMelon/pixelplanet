/*
 * rate limiter utils
 * @flow
 */


/*
 * RateLimiter
 * @param ticksPerMin How many ticks per min are allowed
 * @param burst Amount of ticks that are allowed before limiter kicks in
 * @param onCooldown If we force to wait the whole burst time once the limit is reached
 */
class RateLimiter {
  msPerTick: number;
  burstTime: number;
  cooldownCompletely: boolean;
  onCooldown: boolean;
  wait: number;

  constructor(ticksPerMin = 20, burst = 20, cooldownCompletely = false) {
    this.wait = Date.now();
    this.msPerTick = 60 / ticksPerMin * 1000;
    this.burstTime = burst * this.msPerTick;
    this.cooldownCompletely = cooldownCompletely;
    this.onCooldown = false;
  }

  /*
   * return:
   *   false if rate limiter isn't hit
   *   waitingTime if rate limiter got hit
   */
  tick() {
    const now = Date.now();
    const waitLeft = this.wait - now;
    if (waitLeft >= this.burstTime) {
      this.onCooldown = true;
      return waitLeft;
    }
    if (waitLeft > 0) {
      if (this.cooldownCompletely && this.onCooldown) {
        return waitLeft;
      }
      this.wait += this.msPerTick;
      return false;
    }
    this.wait = now + this.msPerTick;
    this.onCooldown = false;
    return false;
  }
}

export default RateLimiter;
