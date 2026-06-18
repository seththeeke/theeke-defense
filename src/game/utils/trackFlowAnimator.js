/**
 * Animated dashed overlay along a track path to hint movement direction.
 */
export class TrackFlowAnimator {
  constructor(scene, waypoints, options = {}) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.graphics = scene.add.graphics().setDepth(options.depth ?? 2);
    this.phase = 0;
    this.speed = options.speed ?? 55;
    this.dashLength = options.dashLength ?? 10;
    this.gapLength = options.gapLength ?? 14;
    this.lineWidth = options.lineWidth ?? 3;
    this.color = options.color ?? 0xffffff;
    this.alpha = options.alpha ?? 0.5;
    this.segments = [];
    this.totalLength = 0;
    this.buildSegments();
  }

  buildSegments() {
    this.segments = [];
    this.totalLength = 0;

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const a = this.waypoints[i];
      const b = this.waypoints[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) continue;
      this.segments.push({ ax: a.x, ay: a.y, dx, dy, length });
      this.totalLength += length;
    }
  }

  pointAtDistance(distance) {
    if (this.segments.length === 0) {
      return { ...this.waypoints[0] };
    }

    let remaining = Math.max(0, Math.min(distance, this.totalLength));
    for (const seg of this.segments) {
      if (remaining <= seg.length) {
        const t = seg.length > 0 ? remaining / seg.length : 0;
        return {
          x: seg.ax + seg.dx * t,
          y: seg.ay + seg.dy * t,
        };
      }
      remaining -= seg.length;
    }

    const last = this.waypoints[this.waypoints.length - 1];
    return { x: last.x, y: last.y };
  }

  update(dt) {
    if (this.totalLength <= 0) return;

    const patternLen = this.dashLength + this.gapLength;
    this.phase = (this.phase - this.speed * dt) % patternLen;
    if (this.phase < 0) this.phase += patternLen;

    this.graphics.clear();
    this.graphics.lineStyle(this.lineWidth, this.color, this.alpha);

    for (let dist = -this.phase; dist < this.totalLength; dist += patternLen) {
      const dashStart = Math.max(0, dist);
      const dashEnd = Math.min(this.totalLength, dist + this.dashLength);
      if (dashEnd <= dashStart) continue;

      const start = this.pointAtDistance(dashStart);
      const end = this.pointAtDistance(dashEnd);
      this.graphics.beginPath();
      this.graphics.moveTo(start.x, start.y);
      this.graphics.lineTo(end.x, end.y);
      this.graphics.strokePath();
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
