/**
 * Moves an entity along a polyline path defined by waypoints.
 */
export class PathFollower {
  constructor(waypoints) {
    this.waypoints = waypoints;
    this.segmentLengths = [];
    this.totalLength = 0;
    this.distance = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const dx = waypoints[i + 1].x - waypoints[i].x;
      const dy = waypoints[i + 1].y - waypoints[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      this.segmentLengths.push(len);
      this.totalLength += len;
    }
  }

  getPosition() {
    if (this.waypoints.length === 0) return { x: 0, y: 0 };
    if (this.waypoints.length === 1) return { ...this.waypoints[0] };

    let remaining = this.distance;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      const segLen = this.segmentLengths[i];
      if (remaining <= segLen) {
        const t = segLen > 0 ? remaining / segLen : 0;
        const a = this.waypoints[i];
        const b = this.waypoints[i + 1];
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        };
      }
      remaining -= segLen;
    }

    return { ...this.waypoints[this.waypoints.length - 1] };
  }

  advance(deltaDistance) {
    this.distance = Math.min(this.totalLength, this.distance + deltaDistance);
    return this.distance >= this.totalLength;
  }

  getProgress() {
    return this.totalLength > 0 ? this.distance / this.totalLength : 1;
  }

  reset() {
    this.distance = 0;
  }
}

export function getTrackPaths(track) {
  const paths = [{ id: 'path', waypoints: track.path }];
  if (track.path2) {
    paths.push({ id: 'path2', waypoints: track.path2 });
  }
  return paths;
}
