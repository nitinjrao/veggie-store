import api from './api';

interface ProfileCompleteness {
  whatsappSet: boolean;
  hasAddress: boolean;
  canOrder: boolean;
}

export const customerService = {
  getProfileCompleteness: () =>
    api.get<ProfileCompleteness>('/customers/profile/completeness').then((r) => r.data),
};
