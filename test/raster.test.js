import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rasterizeSvg, svgIntrinsicSize } from '../extension/raster.js';

// jsdom ships no <canvas> or blob-loading <img>, so both are mocked. The mock
// records what it was asked to draw so the tests can assert on the geometry and
// the fill decisions rather than on real pixels (renders.test.js covers pixels
// through librsvg).

describe('svgIntrinsicSize', () => {
  it('prefers explicit px width/height', () => {
    expect(svgIntrinsicSize('<svg width="120" height="80"></svg>')).toEqual({
      width: 120,
      height: 80,
    });
  });

  it('strips a px unit', () => {
    expect(svgIntrinsicSize('<svg width="10px" height="10px"></svg>')).toEqual({
      width: 10,
      height: 10,
    });
  });

  it('falls back to the viewBox extent when width/height are absent', () => {
    expect(svgIntrinsicSize('<svg viewBox="0 0 32 24"></svg>')).toEqual({ width: 32, height: 24 });
  });

  it('parses a comma-separated viewBox', () => {
    expect(svgIntrinsicSize('<svg viewBox="0,0,50,50"></svg>')).toEqual({ width: 50, height: 50 });
  });

  it('pins the missing dimension through the viewBox aspect ratio', () => {
    expect(svgIntrinsicSize('<svg width="100" viewBox="0 0 50 25"></svg>')).toEqual({
      width: 100,
      height: 50,
    });
    expect(svgIntrinsicSize('<svg height="100" viewBox="0 0 50 25"></svg>')).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('squares off a single dimension with no viewBox', () => {
    expect(svgIntrinsicSize('<svg width="64"></svg>')).toEqual({ width: 64, height: 64 });
    expect(svgIntrinsicSize('<svg height="48"></svg>')).toEqual({ width: 48, height: 48 });
  });

  it('ignores non-pixel units (percent, em) and defaults', () => {
    expect(svgIntrinsicSize('<svg width="100%" height="100%"></svg>')).toEqual({
      width: 512,
      height: 512,
    });
  });

  it('defaults a dimensionless, viewBox-less icon', () => {
    expect(svgIntrinsicSize('<svg></svg>')).toEqual({ width: 512, height: 512 });
  });

  it('defaults on unparseable markup', () => {
    expect(svgIntrinsicSize('<not-svg')).toEqual({ width: 512, height: 512 });
  });
});

describe('rasterizeSvg', () => {
  let canvas;
  let ctx;
  let toBlobImpl;

  beforeEach(() => {
    ctx = { fillStyle: null, fillRect: vi.fn(), drawImage: vi.fn() };
    toBlobImpl = (cb, type) => cb(new Blob(['x'], { type }));
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb, type) => toBlobImpl(cb, type)),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag) =>
      tag === 'canvas' ? canvas : document.createElementNS('http://www.w3.org/1999/xhtml', tag)
    );

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake');
    globalThis.URL.revokeObjectURL = vi.fn();

    // An <img> that "loads" on the next tick.
    globalThis.Image = class {
      set src(_v) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rasterizes to PNG at the intrinsic size with no background fill', async () => {
    const blob = await rasterizeSvg('<svg width="40" height="20"></svg>', {
      format: 'png',
      scale: 1,
    });
    expect(blob.type).toBe('image/png');
    expect(canvas.width).toBe(40);
    expect(canvas.height).toBe(20);
    expect(ctx.fillRect).not.toHaveBeenCalled(); // PNG keeps transparency
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 40, 20);
  });

  it('scales the canvas by the scale factor', async () => {
    await rasterizeSvg('<svg width="40" height="20"></svg>', { format: 'png', scale: 3 });
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(60);
  });

  it('paints a white background for JPEG (which has no alpha)', async () => {
    const blob = await rasterizeSvg('<svg width="10" height="10"></svg>', { format: 'jpg' });
    expect(blob.type).toBe('image/jpeg');
    expect(ctx.fillStyle).toBe('#ffffff');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 10, 10);
  });

  it('honours an explicit background colour', async () => {
    await rasterizeSvg('<svg width="10" height="10"></svg>', { format: 'png', background: '#000' });
    expect(ctx.fillStyle).toBe('#000');
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('clamps the canvas to the max dimension', async () => {
    await rasterizeSvg('<svg width="5000" height="5000"></svg>', { format: 'png', scale: 4 });
    expect(canvas.width).toBe(8192);
    expect(canvas.height).toBe(8192);
  });

  it('rejects with a clear message when the canvas is tainted (toBlob returns null)', async () => {
    toBlobImpl = (cb) => cb(null);
    await expect(rasterizeSvg('<svg width="10" height="10"></svg>')).rejects.toThrow(
      /could not be converted/
    );
  });

  it('rejects when toBlob throws synchronously on a tainted canvas', async () => {
    toBlobImpl = () => {
      throw new Error('SecurityError');
    };
    await expect(rasterizeSvg('<svg width="10" height="10"></svg>')).rejects.toThrow(
      /cross-origin image/
    );
  });

  it('rejects when the image fails to decode', async () => {
    globalThis.Image = class {
      set src(_v) {
        setTimeout(() => this.onerror?.(), 0);
      }
    };
    await expect(rasterizeSvg('<svg width="10" height="10"></svg>')).rejects.toThrow(
      /could not be rendered/
    );
  });
});
