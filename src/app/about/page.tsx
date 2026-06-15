import Link from 'next/link';

export default function About() {
  return (
    <div className="page-transition max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About GreenMile 🌿</h1>
        <p className="text-xl text-gray-600">
          Turn every commute into a carbon reward. GreenMile is an open-source platform that helps individuals and communities track, reduce, and be rewarded for lowering their carbon footprint through smart mobility choices.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Enter details', desc: 'Input your source, destination, and distance.' },
            { step: 2, title: 'Compare', desc: 'See emissions & cost across different transport modes.' },
            { step: 3, title: 'Choose Green', desc: 'Select an eco-friendly option like Metro, Bus, or Cycle.' },
            { step: 4, title: 'Earn & Track', desc: 'Save CO₂, earn green points, and redeem rewards.' }
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why GreenMile?</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-4">🌍</span>
              <div>
                <h4 className="font-bold">Reduces commute-related emissions</h4>
                <p className="text-gray-600">Visualizing the impact helps change behavior.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-4">🚌</span>
              <div>
                <h4 className="font-bold">Encourages public transport</h4>
                <p className="text-gray-600">Making metro and buses the rewarding choice.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-4">🔄</span>
              <div>
                <h4 className="font-bold">Builds sustainable habits</h4>
                <p className="text-gray-600">Gamification with streaks and points keeps users engaged.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-4">📈</span>
              <div>
                <h4 className="font-bold">Scalable</h4>
                <p className="text-gray-600">Can be adopted by colleges, companies, and cities.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-green-900 mb-6">Future Scope</h2>
          <ul className="space-y-3 text-green-800">
            <li className="flex items-center"><span className="mr-2">📍</span> Live maps and routing API integration</li>
            <li className="flex items-center"><span className="mr-2">🚇</span> Real metro/bus timetable data</li>
            <li className="flex items-center"><span className="mr-2">🤝</span> Verified redemption partners integration</li>
            <li className="flex items-center"><span className="mr-2">🏢</span> Corporate and institutional dashboards</li>
            <li className="flex items-center"><span className="mr-2">🤖</span> AI-based personalized recommendations</li>
            <li className="flex items-center"><span className="mr-2">⚡</span> EV shuttle and e-bike support</li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <Link href="/compare" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-all inline-block shadow-lg hover:shadow-xl">
          Start Your Green Journey 🌿
        </Link>
      </div>
    </div>
  );
}
