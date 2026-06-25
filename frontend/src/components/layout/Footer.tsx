import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-muted-background transition-colors duration-300">
      
      {/* Trust Badges Bar */}
      <div className="border-b border-border py-8 bg-background/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Badge 1 */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-card-border shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Genuine OEM Certified</h4>
                <p className="text-xs text-muted">100% authentic NDT equipment and cables</p>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-card-border shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Same-Day Dispatch</h4>
                <p className="text-xs text-muted">Orders processed before 2 PM standard time</p>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-card-border shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Automated GST Invoices</h4>
                <p className="text-xs text-muted">Instant download of tax complaint invoices</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Brief */}
          <div className="flex flex-col gap-4">
            <span className="text-lg font-bold tracking-tight text-primary">
              CONEX<span className="text-foreground">.in</span>
            </span>
            <p className="text-xs text-muted leading-relaxed">
              India's premium B2B marketplace engineered for high-performance industrial cables, custom coaxial adaptors, and state-of-the-art Non-Destructive Testing (NDT) gear.
            </p>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Product Categories</h4>
            <ul className="space-y-2">
              <li>
                <a href="/?category=Ultrasonic%20Testing" className="text-xs text-muted hover:text-primary transition-colors">Ultrasonic Testing</a>
              </li>
              <li>
                <a href="/?category=Cables%20&%20Accessories" className="text-xs text-muted hover:text-primary transition-colors">Cables & Connectors</a>
              </li>
              <li>
                <a href="/?category=Magnetic%20Particle" className="text-xs text-muted hover:text-primary transition-colors">Magnetic Particle Testing</a>
              </li>
              <li>
                <a href="/?category=Chemicals" className="text-xs text-muted hover:text-primary transition-colors">Industrial NDT Chemicals</a>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Customer Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="/lookup" className="text-xs text-muted hover:text-primary transition-colors">Track RFQ Status</a>
              </li>
              <li>
                <span className="text-xs text-muted">Phone: +91 22 5555 0199</span>
              </li>
              <li>
                <span className="text-xs text-muted">Email: support@conex.in</span>
              </li>
              <li>
                <span className="text-xs text-muted">Mumbai Headquarters, Maharashtra</span>
              </li>
            </ul>
          </div>

          {/* Indian Regulatory Context */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">B2B Compliance</h4>
            <p className="text-xs text-muted leading-relaxed">
              All transactions require a valid GSTIN for corporate pricing tiers. Interstate sales accrue IGST (18%), whereas Maharashtra sales accrue CGST + SGST (9% each).
            </p>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-2xs font-medium text-muted ring-1 ring-inset ring-border">
                GST Ready
              </span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-2xs font-medium text-muted ring-1 ring-inset ring-border">
                Make In India
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} CONEX.in. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-2xs text-muted hover:underline cursor-pointer">Privacy Policy</span>
            <span className="text-2xs text-muted hover:underline cursor-pointer">Terms & Conditions</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
