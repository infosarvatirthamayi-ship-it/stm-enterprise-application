
import api from "../api/api";

const OFFER_BASE = "/api/admin/offers";

/**
 * ============================================================================
 * GET ALL OFFERS
 * ============================================================================
 */
export const getOffers = async (params = {}) => {
  const response = await api.get(OFFER_BASE, { params });
  return response.data;
};

/**
 * ============================================================================
 * GET OFFER BY ID
 * ============================================================================
 */
export const getOfferById = async (id) => {
  const response = await api.get(`${OFFER_BASE}/${id}`);
  return response.data;
};

/**
 * ============================================================================
 * CREATE OFFER
 * ============================================================================
 */
export const createOffer = async (formData) => {
  const response = await api.post(
    `${OFFER_BASE}/create`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * ============================================================================
 * UPDATE OFFER
 * ============================================================================
 */
export const updateOffer = async (id, formData) => {
  const response = await api.put(
    `${OFFER_BASE}/update/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * ============================================================================
 * DELETE OFFER
 * ============================================================================
 */
export const deleteOffer = async (id) => {
  const response = await api.delete(`${OFFER_BASE}/${id}`);
  return response.data;
};
