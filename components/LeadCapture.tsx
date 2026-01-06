
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface LeadData {
    name: string;
    age: string;
    email: string;
    phone: string;
}

interface LeadCaptureProps {
    onCapture: (data: LeadData) => void;
}

const LeadCapture: React.FC<LeadCaptureProps> = ({ onCapture }) => {
    const [formData, setFormData] = useState<LeadData>({ name: '', age: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate delay/network
        await new Promise(r => setTimeout(r, 600));
        onCapture(formData);
        setIsSubmitting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-[70vh] flex flex-col justify-center items-center px-6"
        >
            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-gray-100 max-w-lg w-full text-center space-y-6">
                <div className="w-16 h-16 bg-[#EE8866]/10 rounded-full flex items-center justify-center mx-auto text-3xl">
                    📋
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Tu Informe está listo</h2>
                <p className="text-gray-500">
                    Por favor, completa tus datos para que podamos generar y vincular tu número de expediente único a tu diagnóstico personalizado.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            required
                            type="text"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#EE8866] outline-none transition-colors bg-gray-50 focus:bg-white"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Edad</label>
                        <input
                            required
                            type="number"
                            min="18"
                            max="100"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#EE8866] outline-none transition-colors bg-gray-50 focus:bg-white"
                            value={formData.age}
                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                            placeholder="Ej. 35"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#EE8866] outline-none transition-colors bg-gray-50 focus:bg-white"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="tucorreo@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp</label>
                        <input
                            required
                            type="tel"
                            name="phone"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#EE8866] outline-none transition-colors bg-gray-50 focus:bg-white"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+34 600 000 000"
                        />
                    </div>

                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-[#EE8866] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#E57A57] transition-all shadow-lg shadow-[#EE8866]/20 mt-4"
                    >
                        {isSubmitting ? 'Procesando...' : 'Ver Mis Resultados'}
                    </button>
                </form>
                <p className="text-xs text-gray-400">Tus datos son 100% confidenciales y se usan solo para enviarte tu informe.</p>
            </div>
        </motion.div>
    );
};

export default LeadCapture;
