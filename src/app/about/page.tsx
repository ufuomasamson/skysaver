export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About SkySaver Travels</h1>
          <p className="text-xl">Your trusted partner in air travel, making journeys memorable and seamless</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Company Overview */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#18176b] mb-6">About Us</h2>
              <p className="text-lg text-gray-700 mb-4">
                SkySaver Travels is a dynamic flight booking agency committed to making air travel affordable, 
                convenient, and stress-free for everyone. We specialize in offering competitive airline ticket 
                prices, exclusive travel deals, and personalized customer service to travelers across the globe.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Whether you're planning a family vacation, a last-minute business trip, or a dream adventure abroad, 
                SkySaver Travels ensures you fly smart — and save big.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-[#cd7e0f]">5,830+</div>
                  <div className="text-gray-600 text-sm">Happy Customers</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-[#cd7e0f]">100%</div>
                  <div className="text-gray-600 text-sm">Satisfaction Rate</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-3xl font-bold text-[#cd7e0f]">24/7</div>
                  <div className="text-gray-600 text-sm">Support</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#18176b] to-[#cd7e0f] p-8 rounded-xl text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Why Choose SkySaver Travels?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Best Price Guarantee – We help you fly more for less</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Real-Time Deals – Live access to major airline offers and flash sales</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Trusted Partners – Work with leading global and regional airlines</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Flexible Booking Options – Change or cancel with ease</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#cd7e0f] rounded-full"></div>
                  </div>
                  <span>Customer-Centered Support – Assistance before, during, and after your trip</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="text-[#cd7e0f] text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-[#18176b] mb-4">Our Mission</h3>
              <p className="text-gray-700">
                To connect people to the world through cost-effective and reliable air travel solutions, 
                while providing a seamless booking experience and world-class customer support.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="text-[#cd7e0f] text-4xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold text-[#18176b] mb-4">Our Vision</h3>
              <p className="text-gray-700">
                To be the most trusted and customer-friendly travel agency, known for delivering value, 
                transparency, and unforgettable travel experiences.
              </p>
            </div>
          </div>
        </section>

        {/* Core Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-[#18176b] mb-12">Core Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">✈️</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Flight Booking</h3>
              <p className="text-gray-700">International and domestic flight booking</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">🌍</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Multi-City Booking</h3>
              <p className="text-gray-700">Multi-city and round-trip fare search</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">👥</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Group Booking</h3>
              <p className="text-gray-700">Group flight bookings and corporate travel solutions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">🛡️</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Travel Insurance</h3>
              <p className="text-gray-700">Travel insurance partnerships</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">📋</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">Visa Assistance</h3>
              <p className="text-gray-700">Visa assistance (optional)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#18176b] to-[#cd7e0f] rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-2xl">📞</div>
              </div>
              <h3 className="text-xl font-bold text-[#18176b] mb-2">24/7 Support</h3>
              <p className="text-gray-700">24/7 customer support</p>
            </div>
          </div>
        </section>

        {/* Head Office and Contact Info */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-[#18176b] mb-6">Head Office</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  🏢 13th Street, 47 W 13th St, New York, NY 10011, USA
                </p>
                <p className="text-gray-700">
                  🏢 Quadra CLS 103 Bloco C 1970, Brasília Distrito Federal
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-[#18176b] mb-6">Contact Info</h2>
              <div className="space-y-4">
                <p className="text-gray-700">📞 Phone: +13349484877</p>
                <p className="text-gray-700">📧 Email: contact.skysaver@swtb.online</p>
                <p className="text-gray-700">🌍 Website: www.skysaver.vercel.app</p>
                <p className="text-gray-700">📱 Socials: @SkySaverTravels</p>
                <p className="text-gray-700 text-sm">(Facebook | Instagram | Twitter | LinkedIn)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white p-8 rounded-xl text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="mb-6">Join thousands of satisfied customers who trust SkySaver Travels for their travel needs.</p>
          <div className="flex gap-4 justify-center">
            <a href="/search" className="bg-[#cd7e0f] text-white px-6 py-3 rounded-lg hover:bg-[#cd7e0f]/90 transition-colors duration-300">
              Search Flights
            </a>
            <a href="/contact" className="border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-[#18176b] transition-all duration-300">
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
} 