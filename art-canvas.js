'use strict';

// Render our own SVG geometry with Canvas drawing commands. In forced night mode
// Samsung can recolour SVG fills independently, destroying the pet's markings.
// No SVG image is drawn into the canvas: its paths and colours are drawn directly.
function paintIllustration(target, svgMarkup, className = 'keychain-svg') {
  const template = document.createElement('template');
  template.innerHTML = svgMarkup;
  const source = template.content.firstElementChild;
  source.setAttribute('aria-hidden', 'true');
  const [, , width, height] = source.getAttribute('viewBox').split(/\s+/).map(Number);
  source.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;visibility:hidden;pointer-events:none`;
  document.body.append(source);

  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.width = width * 2;
  canvas.height = height * 2;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const definitions = new Map(Array.from(source.querySelectorAll('defs [id]'), node => [node.id, node]));
  const numbers = value => (value.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
  const number = (node, attribute, fallback = 0) => Number(node.getAttribute(attribute) ?? fallback);

  function transform(value) {
    for (const match of value.matchAll(/(translate|rotate|scale|matrix)\(([^)]+)\)/g)) {
      const [a, b, c, d, e, f] = numbers(match[2]);
      if (match[1] === 'translate') ctx.translate(a, b || 0);
      if (match[1] === 'scale') ctx.scale(a, b ?? a);
      if (match[1] === 'matrix') ctx.transform(a, b, c, d, e, f);
      if (match[1] === 'rotate') {
        ctx.translate(b || 0, c || 0);
        ctx.rotate(a * Math.PI / 180);
        ctx.translate(-(b || 0), -(c || 0));
      }
    }
  }

  function paint(value, node) {
    const reference = /^url\(#(.+)\)$/.exec(value);
    if (!reference) return value;
    const definition = definitions.get(reference[1]);
    if (!definition) throw new Error('Unknown illustration gradient: ' + reference[1]);
    const bounds = node.getBBox();
    const coordinate = (attribute, fallback) => {
      const raw = definition.getAttribute(attribute);
      return raw === null ? fallback : raw.endsWith('%') ? parseFloat(raw) / 100 : Number(raw);
    };
    ctx.save();
    ctx.translate(bounds.x, bounds.y);
    ctx.scale(bounds.width || 1, bounds.height || 1);
    let gradient;
    if (definition.localName === 'linearGradient') {
      gradient = ctx.createLinearGradient(coordinate('x1', 0), coordinate('y1', 0), coordinate('x2', 1), coordinate('y2', 0));
    } else {
      const cx = coordinate('cx', .5), cy = coordinate('cy', .5);
      gradient = ctx.createRadialGradient(coordinate('fx', cx), coordinate('fy', cy), 0, cx, cy, coordinate('r', .5));
    }
    ctx.restore();
    for (const stop of definition.children) {
      const raw = stop.getAttribute('offset') || '0';
      gradient.addColorStop(raw.endsWith('%') ? parseFloat(raw) / 100 : Number(raw), stop.getAttribute('stop-color'));
    }
    return gradient;
  }

  function draw(node, inherited) {
    if (node.localName === 'defs') return;
    ctx.save();
    if (node.hasAttribute('transform')) transform(node.getAttribute('transform'));
    const style = { ...inherited };
    for (const property of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'font-size', 'font-family', 'text-anchor']) {
      if (node.hasAttribute(property)) style[property] = node.getAttribute(property);
    }
    ctx.globalAlpha *= number(node, 'opacity', 1);
    ctx.lineWidth = Number(style['stroke-width']);
    ctx.lineCap = style['stroke-linecap'];
    ctx.lineJoin = style['stroke-linejoin'];
    const filterId = /^url\(#(.+)\)$/.exec(node.getAttribute('filter') || '');
    if (filterId) {
      const filter = definitions.get(filterId[1]);
      const shadow = filter?.querySelector('feDropShadow');
      const blur = filter?.querySelector('feGaussianBlur');
      if (shadow) {
        ctx.shadowOffsetX = number(shadow, 'dx');
        ctx.shadowOffsetY = number(shadow, 'dy');
        ctx.shadowBlur = number(shadow, 'stdDeviation') * 2;
        ctx.shadowColor = (shadow.getAttribute('flood-color') || '#000000') + Math.round(number(shadow, 'flood-opacity', 1) * 255).toString(16).padStart(2, '0');
      }
      if (blur) ctx.filter = `blur(${number(blur, 'stdDeviation')}px)`;
    }

    let path;
    if (node.localName === 'path') path = new Path2D(node.getAttribute('d'));
    if (node.localName === 'circle' || node.localName === 'ellipse') {
      path = new Path2D();
      path.ellipse(number(node, 'cx'), number(node, 'cy'), number(node, 'rx', number(node, 'r')), number(node, 'ry', number(node, 'r')), 0, 0, Math.PI * 2);
    }
    if (node.localName === 'rect') {
      path = new Path2D();
      const x = number(node, 'x'), y = number(node, 'y'), w = number(node, 'width'), h = number(node, 'height');
      const r = Math.min(number(node, 'rx'), w / 2, h / 2);
      path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
      path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
      path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y); path.closePath();
    }
    if (path) {
      if (style.fill !== 'none') { ctx.fillStyle = paint(style.fill, node); ctx.fill(path); }
      if (style.stroke !== 'none') { ctx.strokeStyle = paint(style.stroke, node); ctx.stroke(path); }
    } else if (node.localName === 'text') {
      ctx.font = `${style['font-size']}px ${style['font-family']}`;
      ctx.textAlign = style['text-anchor'] === 'middle' ? 'center' : 'left';
      ctx.fillStyle = paint(style.fill, node);
      ctx.fillText(node.textContent, number(node, 'x'), number(node, 'y'));
    } else {
      for (const child of node.children) draw(child, style);
    }
    ctx.restore();
  }

  try {
    ctx.scale(2, 2);
    draw(source, { fill: '#000', stroke: 'none', 'stroke-width': '1', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'font-size': '16', 'font-family': 'serif', 'text-anchor': 'start' });
    const previous = target.querySelector('.' + className);
    if (previous) previous.replaceWith(canvas);
    else target.append(canvas);
  } finally {
    source.remove();
  }
}
