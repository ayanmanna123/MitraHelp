import { Link } from 'react-router-dom';
import { FaAmbulance, FaHandHoldingHeart } from 'react-icons/fa';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <header className="bg-red-600 text-white py-20 px-4 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">MitraHelp</h1>
                <p className="text-xl md:text-2xl mb-8">Emergency Volunteer & Assistance Platform</p>
                <div className="flex justify-center gap-4">
                    <Link to="/emergency/create" className="bg-white text-red-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition">
                        Request Help Now
                    </Link>
                    <Link to="/login" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition">
                        Volunteer Login
                    </Link>
                </div>
            </header>

            {/* Features */}
            <main className="flex-grow container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-8 text-center">
                    <div className="p-8 border rounded-xl shadow-sm hover:shadow-md transition">
                        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaAmbulance size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Emergency Help</h2>
                        <p className="text-gray-600">Get immediate assistance for medical emergencies, accidents, or disasters from nearby volunteers.</p>
                    </div>
                    <div className="p-8 border rounded-xl shadow-sm hover:shadow-md transition">
                        <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaHandHoldingHeart size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Volunteer Network</h2>
                        <p className="text-gray-600">Join our growing community of verified volunteers and blood donors to save lives.</p>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-800 text-white py-6 text-center">
                <p>&copy; 2026 MitraHelp. Saving Lives Together.</p>
            </footer>
        </div>
    );
};

export default Home;
