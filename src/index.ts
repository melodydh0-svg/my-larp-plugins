// index.ts: Финальная версия модуля LARP для Vendetta/Revenge
import { patcher, common } from "@vendetta";
import { storage } from "@vendetta/plugin";
import { registerSettings } from "./Settings";

// Хранилище: ID пользователя -> данные подмены
export const pluginStorage = storage as {
    spoofs: Record<string, { username: string, badges: number, memberSince: number }>
};

// Инициализация при первом запуске
pluginStorage.spoofs ??= {};

export default {
    onLoad: () => {
        // 1. Патч UserStore для подмены имени и значков
        this.unpatchUser = patcher.after("getUser", common.users, (args, ret) => {
            if (!ret || !pluginStorage.spoofs[ret.id]) return ret;
            const s = pluginStorage.spoofs[ret.id];
            
            // Применяем подмену
            ret.username = s.username;
            ret.publicFlags = s.badges;
            return ret;
        });

        // 2. Патч компонента MemberSince для подмены даты регистрации
        this.unpatchDate = patcher.after("default", common.components.MemberSince, (args, ret) => {
            const userId = args[0]?.user?.id;
            if (pluginStorage.spoofs[userId]) {
                // Подменяем текст даты
                ret.props.children = new Date(pluginStorage.spoofs[userId].memberSince).toLocaleDateString();
            }
            return ret;
        });

        // Регистрация настроек
        registerSettings();
    },
    onUnload: () => {
        // Очистка патчей при выгрузке плагина
        this.unpatchUser?.();
        this.unpatchDate?.();
    }
};
