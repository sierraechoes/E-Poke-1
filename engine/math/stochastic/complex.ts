/**
 * engine/math/stochastic/complex.ts
 *
 * Minimal complex-number arithmetic for the Heston / jump-diffusion Fourier
 * pricers. Principal-branch sqrt / log / exp.
 */
export interface C {
  re: number;
  im: number;
}

export const cx = (re: number, im = 0): C => ({ re, im });
export const cadd = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
export const csub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });
export const cmul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
export const cscale = (a: C, s: number): C => ({ re: a.re * s, im: a.im * s });
export const cdiv = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const cabs = (a: C): number => Math.hypot(a.re, a.im);

/** Principal-branch complex square root. */
export function csqrt(a: C): C {
  const r = Math.hypot(a.re, a.im);
  if (r === 0) return { re: 0, im: 0 };
  const re = Math.sqrt((r + a.re) / 2);
  let im = Math.sqrt((r - a.re) / 2);
  if (a.im < 0) im = -im;
  return { re, im };
}

/** Complex exponential e^{a} = e^{re}(cos im + i sin im). */
export function cexp(a: C): C {
  const er = Math.exp(a.re);
  return { re: er * Math.cos(a.im), im: er * Math.sin(a.im) };
}

/** Principal-branch complex natural log ln(a) = ln|a| + i arg(a). */
export function cln(a: C): C {
  return { re: Math.log(Math.hypot(a.re, a.im)), im: Math.atan2(a.im, a.re) };
}
