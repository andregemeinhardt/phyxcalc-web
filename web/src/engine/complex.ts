/**
 * Complex number implementation for PhyxCalc engine.
 */

export class Complex {
  readonly real: number;
  readonly imag: number;

  constructor(real: number = 0, imag: number = 0) {
    this.real = real;
    this.imag = imag;
  }

  static zero(): Complex {
    return new Complex(0, 0);
  }

  static one(): Complex {
    return new Complex(1, 0);
  }

  static fromReal(r: number): Complex {
    return new Complex(r, 0);
  }

  static fromImag(i: number): Complex {
    return new Complex(0, i);
  }

  isReal(): boolean {
    return Math.abs(this.imag) < 1e-15;
  }

  isZero(): boolean {
    return Math.abs(this.real) < 1e-15 && Math.abs(this.imag) < 1e-15;
  }

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  sub(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  div(other: Complex): Complex {
    const denom = other.real * other.real + other.imag * other.imag;
    if (denom === 0) {
      return new Complex(this.real >= 0 ? Infinity : -Infinity, NaN);
    }
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denom,
      (this.imag * other.real - this.real * other.imag) / denom
    );
  }

  neg(): Complex {
    return new Complex(-this.real, -this.imag);
  }

  abs(): number {
    return Math.hypot(this.real, this.imag);
  }

  arg(): number {
    return Math.atan2(this.imag, this.real);
  }

  conj(): Complex {
    return new Complex(this.real, -this.imag);
  }

  pow(other: Complex): Complex {
    if (this.isZero()) {
      return other.isZero() ? Complex.one() : Complex.zero();
    }
    if (other.isReal()) {
      const p = other.real;
      if (this.isReal() && this.real >= 0) {
        return Complex.fromReal(Math.pow(this.real, p));
      }
      if (this.isReal() && this.real < 0 && Number.isInteger(p)) {
        return Complex.fromReal(Math.pow(this.real, p));
      }
    }
    // w = a^b = exp(b * ln(a))
    const lnA = this.ln();
    const bLnA = other.mul(lnA);
    return bLnA.exp();
  }

  exp(): Complex {
    const r = Math.exp(this.real);
    return new Complex(r * Math.cos(this.imag), r * Math.sin(this.imag));
  }

  ln(): Complex {
    return new Complex(Math.log(this.abs()), this.arg());
  }

  sin(): Complex {
    return new Complex(
      Math.sin(this.real) * Math.cosh(this.imag),
      Math.cos(this.real) * Math.sinh(this.imag)
    );
  }

  cos(): Complex {
    return new Complex(
      Math.cos(this.real) * Math.cosh(this.imag),
      -Math.sin(this.real) * Math.sinh(this.imag)
    );
  }

  tan(): Complex {
    return this.sin().div(this.cos());
  }

  equals(other: Complex): boolean {
    return Math.abs(this.real - other.real) < 1e-12 && Math.abs(this.imag - other.imag) < 1e-12;
  }

  sinh(): Complex {
    return new Complex(
      Math.sinh(this.real) * Math.cos(this.imag),
      Math.cosh(this.real) * Math.sin(this.imag)
    );
  }

  cosh(): Complex {
    return new Complex(
      Math.cosh(this.real) * Math.cos(this.imag),
      Math.sinh(this.real) * Math.sin(this.imag)
    );
  }

  tanh(): Complex {
    return this.sinh().div(this.cosh());
  }

  asin(): Complex {
    if (this.isReal() && Math.abs(this.real) <= 1) {
      return Complex.fromReal(Math.asin(this.real));
    }
    // asin(z) = -i * ln(i*z + sqrt(1 - z^2))
    const iz = new Complex(-this.imag, this.real);
    const sqrtPart = Complex.one().sub(this.mul(this)).sqrt();
    const sum = iz.add(sqrtPart);
    return new Complex(0, -1).mul(sum.ln());
  }

  acos(): Complex {
    if (this.isReal() && Math.abs(this.real) <= 1) {
      return Complex.fromReal(Math.acos(this.real));
    }
    // acos(z) = pi/2 - asin(z)
    return Complex.fromReal(Math.PI / 2).sub(this.asin());
  }

  atan(): Complex {
    if (this.isReal()) {
      return Complex.fromReal(Math.atan(this.real));
    }
    // atan(z) = (i/2) * ln((1 - i*z) / (1 + i*z))
    const iz = new Complex(-this.imag, this.real);
    const num = Complex.one().sub(iz);
    const den = Complex.one().add(iz);
    const lnPart = num.div(den).ln();
    return new Complex(0, 0.5).mul(lnPart);
  }

  sqrt(): Complex {
    return this.pow(new Complex(0.5, 0));
  }
}
