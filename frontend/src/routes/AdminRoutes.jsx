import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LocationManager from '../pages/admin/LocationManager';
import { AdminProtectedRoute } from "../components/protected/AdminProtectedRoute";
import CreateTempleAdmin from "../pages/admin/CreateTempleAdmin";

// Dashboard
import Dashboard from "../pages/admin/Dashboard";
import DashboardHome from "../pages/admin/DashboardHome";

// Users
import UsersList from "../pages/admin/users/UsersList";
import ViewUser from "../pages/admin/users/ViewUser";
import EditUser from "../pages/admin/users/EditUser";

// Donations
import DonationList from "../pages/admin/donation/DonationList";
import AddDonation from "../pages/admin/donation/AddDonation";
import ViewDonation from "../pages/admin/donation/ViewDonation";
import EditDonation from "../pages/admin/donation/EditDonation";

// Temples
import TempleList from "../pages/admin/temple/TempleList";
import AddTemple from "../pages/admin/temple/AddTemple";
import ViewTemple from "../pages/admin/temple/ViewTemple";
import EditTemple from "../pages/admin/temple/EditTemple";
import TempleBookings from "../pages/admin/temple/TempleBookings";
import TempleBookingsView from "../pages/admin/temple/TempleBookingsView";

// Rituals
import RitualList from "../pages/admin/ritual/RitualList";
import RitualView from "../pages/admin/ritual/RitualView";
import RitualEdit from "../pages/admin/ritual/RitualEdit";
import AddRitual from "../pages/admin/ritual/AddRitual";
import RitualPackages from "../pages/admin/ritual/RitualPackages";
import RitualPackageAdd from "../pages/admin/ritual/ritualpackagelist/RitualPackageAdd";
import RitualPackageView from "../pages/admin/ritual/ritualpackagelist/RitualPackageView";
import RitualPackageEdit from "../pages/admin/ritual/ritualpackagelist/RitualPackageEdit";
import RitualBookings from "../pages/admin/ritual/RitualBookings";
import RitualBookingsView from "../pages/admin/ritual/RitualBookingsView";
import RitualTypes from "../pages/admin/ritual/RitualTypes";
import RitualTypesAdd from "../pages/admin/ritual/ritualtypeslist/RitualTypesAdd";
import RitualTypesEdit from "../pages/admin/ritual/ritualtypeslist/RitualTypesEdit";
import RitualTypesView from "../pages/admin/ritual/ritualtypeslist/RitualTypesView";

// Memberships
import MembershipList from "../pages/admin/membership/MembershipList";
import MembershipAdd from "../pages/admin/membership/MembershipAdd";
import PurchasedCards from "../pages/admin/membership/PurchasedCards";
import ViewPurchasedCard from "../pages/admin/membership/ViewPurchasedCard";
import ViewMembership from "../pages/admin/membership/ViewMembership";
import EditMembershipPage from "../pages/admin/membership/EditMembershipPage";

// Vouchers
import VoucherList from "../pages/admin/voucher/VoucherList";
import VoucherAdd from "../pages/admin/voucher/VoucherAdd";
import VoucherView from "../pages/admin/voucher/VoucherView";
import VoucherEdit from "../pages/admin/voucher/VoucherEdit";

// Events
import EventList from "../pages/admin/event/EventList";
import AddEvent from "../pages/admin/event/AddEvent";
import EventView from "../pages/admin/event/EventView";
import EventEdit from "../pages/admin/event/EventEdit";
import EventBookings from "../pages/admin/event/EventBookings";
import EventBookingView from "../pages/admin/event/EventBookingView";

// Offers
import OfferList from "../pages/admin/offers/OfferList";
import AddOffer from "../pages/admin/offers/AddOffer";
import EditOffer from "../pages/admin/offers/EditOffer";
import OfferView from "../pages/admin/offers/OfferView";

// Settings
import Profile from "../pages/admin/profile/Profile";
import Menu from "../pages/admin/settings/Menu";
import Translation from "../pages/admin/settings/Translation";
import VedPathShala from "../pages/ved-path-shala/VedaPathShala";

export const AdminRoutes = () => {
  return (
    <Routes>
      {/* This Layout Route wraps ALL admin pages with the Dashboard UI 
        and protects them so only user_type 1 (Admin) can view them.
      */}
      <Route
        element={
          <AdminProtectedRoute allowedTypes={[1]}>
            <Dashboard />
          </AdminProtectedRoute>
        }
      >
        {/* Default route redirects to dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="create-temple-admin" element={<CreateTempleAdmin />} />
        <Route path="locations" element={<LocationManager />} />

        {/* Users */}
        <Route path="user/list" element={<UsersList />} />
        <Route path="user/view/:id" element={<ViewUser />} />
        <Route path="user/edit/:id" element={<EditUser />} />

        {/* Donations */}
        <Route path="donation" element={<DonationList />} />
        <Route path="donation/add" element={<AddDonation />} />
        <Route path="donation/view/:id" element={<ViewDonation />} />
        <Route path="donation/edit/:id" element={<EditDonation />} />

        {/* Temples */}
        <Route path="temple" element={<TempleList />} />
        <Route path="temple/add" element={<AddTemple />} />
        <Route path="temple/view/:id" element={<ViewTemple />} />
        <Route path="temple/edit/:id" element={<EditTemple />} />
        <Route path="temple-booking" element={<TempleBookings />} />
        <Route path="temple-booking/view/:id" element={<TempleBookingsView />} />

        {/* Rituals */}
        <Route path="ritual" element={<RitualList />} />
        <Route path="ritual/add" element={<AddRitual />} />
        <Route path="ritual/view/:id" element={<RitualView />} />
        <Route path="ritual/edit/:id" element={<RitualEdit />} />

        {/* Ritual Packages */}
        <Route path="ritual/package" element={<RitualPackages />} />
        <Route path="ritual/package/add" element={<RitualPackageAdd />} />
        <Route path="ritual/package/view/:id" element={<RitualPackageView />} />
        <Route path="ritual/package/edit/:id" element={<RitualPackageEdit />} />

        {/* Ritual Types */}
        <Route path="ritual/type" element={<RitualTypes />} />
        <Route path="ritual/type/add" element={<RitualTypesAdd />} />
        <Route path="ritual/type/view/:id" element={<RitualTypesView />} />
        <Route path="ritual/type/edit/:id" element={<RitualTypesEdit />} />

        {/* Ritual Bookings */}
        <Route path="ritual-booking" element={<RitualBookings />} />
        <Route path="ritual-bookings/:id" element={<RitualBookingsView />} />

        {/* Membership */}
        <Route path="membership-card" element={<MembershipList />} />
        <Route path="membership/add" element={<MembershipAdd />} />
        <Route path="membership/view/:id" element={<ViewMembership />} />
        <Route path="membership/edit/:id" element={<EditMembershipPage />} />
        <Route path="purchased-member-card" element={<PurchasedCards />} />
        <Route path="purchased-member-card/view/:id" element={<ViewPurchasedCard />} />

        {/* Voucher */}
        <Route path="voucher" element={<VoucherList />} />
        <Route path="voucher/add" element={<VoucherAdd />} />
        <Route path="voucher/view/:id" element={<VoucherView />} />
        <Route path="voucher/edit/:id" element={<VoucherEdit />} />

        {/* Events */}
        <Route path="event" element={<EventList />} />
        <Route path="event/add" element={<AddEvent />} />
        <Route path="event/view/:id" element={<EventView />} />
        <Route path="event/edit/:id" element={<EventEdit />} />
        <Route path="event-booking" element={<EventBookings />} />
        <Route path="event-booking/view/:id" element={<EventBookingView />} />

        {/* Offers */}
        <Route path="offers" element={<OfferList />} />
        <Route path="offer/create" element={<AddOffer />} />
        <Route path="offer/edit/:id" element={<EditOffer />} />
        <Route path="offer/view/:id" element={<OfferView />} />
        
        {/* Settings */}
        <Route path="ved_path_shala" element={<VedPathShala />} />
        <Route path="translation" element={<Translation />} />
        <Route path="menu" element={<Menu />} />
        <Route path="profile" element={<Profile />} />

      </Route>
    </Routes>
  );
};