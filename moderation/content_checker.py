"""
Простая модерация ресурсов до подключения чего-то более умного.
Возвращает (status, reason): status = 'approved' | 'pending' | 'rejected'
"""

BAD_WORDS = ["казино", "ставки", "порно", "хакер", "взлом", "18+"]


async def auto_moderate_resource(description: str, resource_type: str):
    text = (description or "").lower()

    for word in BAD_WORDS:
        if word in text:
            return "rejected", f"Обнаружено запрещённое слово: {word}"

    if len(text.strip()) < 10:
        return "pending", "Слишком короткое описание — нужна проверка вручную"

    return "approved", "OK"
