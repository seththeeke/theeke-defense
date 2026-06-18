export function clientToGamePoint(game, clientX, clientY) {
  const canvas = game.canvas;
  const rect = canvas.getBoundingClientRect();
  const displayX = clientX - rect.left;
  const displayY = clientY - rect.top;
  return {
    x: game.scale.transformX(displayX),
    y: game.scale.transformY(displayY),
  };
}

export function isClientOverCanvas(game, clientX, clientY) {
  const rect = game.canvas.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}
