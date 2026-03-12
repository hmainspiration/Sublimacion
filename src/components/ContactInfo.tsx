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
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-xl shadow-lg border border-stone-200 flex flex-col gap-2">
      {settings.telefono && (
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <Phone className="h-4 w-4 text-emerald-600" />
          <span>{settings.telefono}</span>
        </div>
      )}
      {settings.banco && (
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>{settings.banco}</span>
        </div>
      )}
      {settings.redes && (
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <Share2 className="h-4 w-4 text-emerald-600" />
          <span>{settings.redes}</span>
        </div>
      )}
    </div>
  );
}
