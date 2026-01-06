
import { AssessmentResult } from '../types';

export interface ContactData {
    name: string;
    age: string;
    email: string;
    phone: string;
}

export interface LeadRecord {
    id: string;
    timestamp: string;
    gender: 'mujer' | 'hombre';
    answers: Record<string, number>;
    score: number;
    recommendation: string;
    treatment: string;
    contact: ContactData;
}

const KEY = 'pelviu_leads_db';

export const storage = {
    getAll: (): LeadRecord[] => {
        try {
            return JSON.parse(localStorage.getItem(KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    save: (data: LeadRecord): void => {
        const db = storage.getAll();
        db.push(data);
        localStorage.setItem(KEY, JSON.stringify(db));
    },

    update: (id: string, updates: Partial<LeadRecord>): boolean => {
        const db = storage.getAll();
        const index = db.findIndex(item => item.id === id);
        if (index !== -1) {
            db[index] = { ...db[index], ...updates };
            localStorage.setItem(KEY, JSON.stringify(db));
            return true;
        }
        return false;
    },

    createAssessment: (
        gender: 'mujer' | 'hombre',
        answers: Record<number, number>,
        result: AssessmentResult,
        contact?: ContactData
    ): string => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        // Convert numerical keys to string keys for storage consistency
        const stringKeyAnswers: Record<string, number> = {};
        Object.entries(answers).forEach(([k, v]) => {
            stringKeyAnswers[k] = v;
        });

        const record: LeadRecord = {
            id,
            timestamp: new Date().toISOString(),
            gender,
            answers: stringKeyAnswers,
            score: result.score,
            recommendation: result.recommendation,
            treatment: result.treatment.name,
            contact: contact || { name: '', age: '', email: '', phone: '' }
        };
        storage.save(record);
        return id;
    },

    exportCSV: (): void => {
        const db = storage.getAll();
        if (db.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        // Headers
        const headers = [
            "ID", "Fecha", "Género", "Edad", "Puntuación",
            "Recomendación", "Tratamiento", "Nombre", "Email",
            "Teléfono", "Respuestas (JSON)"
        ];

        // Rows
        const rows = db.map(row => [
            row.id,
            new Date(row.timestamp).toLocaleString(),
            row.gender,
            row.contact?.age || '',
            row.score,
            row.recommendation,
            row.treatment,
            row.contact?.name || '',
            row.contact?.email || '',
            row.contact?.phone || '',
            JSON.stringify(row.answers).replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(c => `"${c}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pelviu_leads_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    clear: (): void => {
        localStorage.removeItem(KEY);
    }
};
