import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  ScheduleAnnouncementRequest,
  AnnouncementQueryParams,
} from "../../../types/platform/announcements";

const BASE_URL = "api/v1/platform/announcements";

export async function getAnnouncements(
  params: AnnouncementQueryParams = {}
): Promise<PageResponse<Announcement>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<Announcement>>();
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  return api.get(`${BASE_URL}/${id}`).json<Announcement>();
}

export async function createAnnouncement(
  data: CreateAnnouncementRequest
): Promise<Announcement> {
  return api.post(BASE_URL, { json: data }).json<Announcement>();
}

export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementRequest
): Promise<Announcement> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<Announcement>();
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
  return api.post(`${BASE_URL}/${id}/publish`).json<Announcement>();
}

export async function scheduleAnnouncement(
  id: string,
  data: ScheduleAnnouncementRequest
): Promise<Announcement> {
  return api
    .post(`${BASE_URL}/${id}/schedule`, { json: data })
    .json<Announcement>();
}

export async function archiveAnnouncement(id: string): Promise<Announcement> {
  return api.post(`${BASE_URL}/${id}/archive`).json<Announcement>();
}
