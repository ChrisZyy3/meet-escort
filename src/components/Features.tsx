import type { FC } from 'react';

/**
 * Features Component
 * 
 * Bundles the "How it works" sequence guide with the "9 reasons to use" list
 * using highly responsive grid column structures.
 * 
 * Written in 100% English. Annotations in code blocks are retained in bilingual format.
 */
export const Features: FC = () => {
  return (
    <div className="bg-white">
      {/* 1. How It Works Section */}
      {/* 运作流程 */}
      <section className="py-12 md:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-dark mb-4">
            How it works
          </h2>
          <p className="text-neutral-light font-medium max-w-xl mx-auto mb-12">
            Getting connected with premium online services is easy. Follow these simple steps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            {/* 步骤 1 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">1</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                Live search results
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 1" 
                  src="/home_files/how-1.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                Receive tailored results of escorts in your area, available to meet right now!
              </p>
            </div>

            {/* Step 2 */}
            {/* 步骤 2 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">2</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                Fast confirmations
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 2" 
                  src="/home_files/how-2.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                Requests are sent direct to the escort and responded to within 2-5 mins.
              </p>
            </div>

            {/* Step 3 */}
            {/* 步骤 3 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">3</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                Real-time updates
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 3" 
                  src="/home_files/how-3.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                Discreet notifications let clients know of any delays and important updates.
              </p>
            </div>

            {/* Step 4 */}
            {/* 步骤 4 */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-primary mb-3">4</span>
              <h4 className="text-lg font-bold text-neutral-dark mb-4">
                Discreet feedback
              </h4>
              <div className="h-72 mb-4 overflow-hidden rounded-2xl shadow-sm border border-gray-100 hover-scale">
                <img 
                  alt="Smooci how it works step 4" 
                  src="/home_files/how-4.jpg" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <p className="text-sm text-neutral-medium px-4">
                Leave an honest review of your escort experience, which will be posted anonymously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 9 Reasons Section */}
      {/* 9大选择理由 */}
      <section className="py-12 md:py-20 bg-neutral-bgLight/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-neutral-dark text-center mb-12">
            9 reasons to use Smooci
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reason 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">No commissions or fees</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                The companion keeps 100% of what she charges. No booking fees or commissions are charged by Smooci.
              </p>
            </div>
            
            {/* Reason 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">100% discreet requests</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Clients can safely and discreetly request a date with an escort. Privacy and trust is a top priority for Smooci.
              </p>
            </div>

            {/* Reason 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Exclusive content</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                As a premium client you get access to exclusive escort content, including videos, photos, and updates.
              </p>
            </div>

            {/* Reason 4 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Real-time online searches</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Filter offline and online companions to get connected immediately and request to meet without delays.
              </p>
            </div>

            {/* Reason 5 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Live chat system</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Smooci gives premium clients the ability to message the companion directly.
              </p>
            </div>

            {/* Reason 6 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Online notifications</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Premium clients can search offline companions and set alerts, notifying when they are next available.
              </p>
            </div>

            {/* Reason 7 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Verified escort reviews</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Trusted reviews, written by real clients who can be trusted. All reviews are 100% verified.
              </p>
            </div>

            {/* Reason 8 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Age &amp; photo verification</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Companions have their age and photos verified by Smooci’s 24/7 support staff. Verified profiles are highlighted.
              </p>
            </div>

            {/* Reason 9 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="text-base md:text-lg font-bold text-neutral-dark mb-2">Smooci is not an escort agency</h5>
              <p className="text-sm text-neutral-light leading-relaxed">
                Smooci is a technology company that connects clients and companions in the safest way possible for both parties.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
