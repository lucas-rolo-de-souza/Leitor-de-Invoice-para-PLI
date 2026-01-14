import { useLanguage } from "../contexts/TranslationContext";

export const useTranslation = () => {
  const { t } = useLanguage();
  return t;
};
