import { supabase } from '../supabaseClient';

export const logActivity = async (actionType, entityType, description, severity = 'INFO') => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email || 'Sistema';

        const { error } = await supabase.from('activity_logs').insert([{
            user_email: userEmail,
            action_type: actionType,
            entity_type: entityType,
            description,
            severity
        }]);

        if (error) console.error("Error al guardar log:", error);
    } catch (err) {
        console.error("No se pudo registrar la actividad:", err);
    }
};
