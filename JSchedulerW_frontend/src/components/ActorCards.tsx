import { landingData } from "../constants/landingData";
import {
  ShoppingCart,
  CreditCard,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

export function ActorCards() {
  const { seller, customer, manager } = landingData.actorFunnel;

  return (
    <section id="actors" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="heading-section text-brand-text mb-4">
            Choose Your Path
          </h2>
          <p className="text-sub">
            Whether you are selling, buying, or managing operations, NoThrowam
            has a dedicated portal for your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Seller Card */}
          <div className="card-yellow flex flex-col justify-between group cursor-pointer">
            <div>
              <div className="w-16 h-16 bg-brand-yellow/20 rounded-2xl flex items-center justify-center mb-6 text-brand-yellow group-hover:scale-110 transition-transform">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{seller.title}</h3>
              <p className="text-brand-text/70 mb-8">{seller.description}</p>
            </div>

            <button className="w-full btn border-2 border-brand-yellow/30 bg-white hover:bg-brand-yellow/10 text-brand-text font-bold flex items-center justify-between group-hover:border-brand-yellow transition-colors">
              <span>{seller.ctaText}</span>
              <ArrowRight className="w-5 h-5 text-brand-yellow group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Customer Card */}
          <div className="card-red flex flex-col justify-between group cursor-pointer relative top-0 md:top-8">
            <div>
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-6 text-brand-red group-hover:scale-110 transition-transform">
                <CreditCard size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{customer.title}</h3>
              <p className="text-brand-text/70 mb-8">{customer.description}</p>
            </div>

            <button className="w-full btn border-2 border-brand-red/30 bg-white hover:bg-brand-red/10 text-brand-text font-bold flex items-center justify-between group-hover:border-brand-red transition-colors">
              <span>{customer.ctaText}</span>
              <ArrowRight className="w-5 h-5 text-brand-red group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Manager Card */}
          <div className="card-green flex flex-col justify-between group cursor-pointer">
            <div>
              <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform">
                <ClipboardCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{manager.title}</h3>
              <p className="text-brand-text/70 mb-8">{manager.description}</p>
            </div>

            <button className="w-full btn border-2 border-brand-green/30 bg-white hover:bg-brand-green/10 text-brand-text font-bold flex items-center justify-between group-hover:border-brand-green transition-colors">
              <span>{manager.ctaText}</span>
              <ArrowRight className="w-5 h-5 text-brand-green group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
