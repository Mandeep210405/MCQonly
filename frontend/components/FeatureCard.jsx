const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3aff]/5 hover:border-[#1a3aff]/20 transition-all duration-300">
    <div className="w-14 h-14 bg-[#e8eeff] rounded-2xl flex items-center justify-center text-[#1a3aff] mb-8">
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-bold text-[#0a0f2e] mb-4">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{description}</p>
  </div>
);