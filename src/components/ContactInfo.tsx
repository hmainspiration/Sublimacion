import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Phone, Building2, Share2 } from 'lucide-react';

export default function ContactInfo() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'contacto'));
      if (docSnap.exists() && docSnap.data().visible) {
        setSettings(docSnap.data());
      }
    };
    fetchSettings();
  }, []);

  if (!settings) return null;

  return (
    <div className="bg-navy-900 text-stone-300 py-2 px-4 text-xs sm:text-sm border-b border-navy-800">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center sm:justify-end items-center gap-4 sm:gap-6">
        {settings.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gold-500" />
            <span>{settings.telefono}</span>
          </div>
        )}
        {settings.banco && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-gold-500" />
            <span>{settings.banco}</span>
          </div>
        )}
        {settings.redes && (
          <div className="flex items-center gap-2">
            <Share2 className="h-3.5 w-3.5 text-gold-500" />
            <span>{settings.redes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
