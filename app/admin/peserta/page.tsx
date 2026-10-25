'use client';

import React from 'react';
import { usePesertaData } from '@/lib/hooks/usePesertaData';
import PesertaHeader, {
  PesertaUtilityModals,
} from '@/components/admin/peserta/PesertaHeader';
import PesertaTabs from '@/components/admin/peserta/PesertaTabs';
import SantriTable from '@/components/admin/peserta/SantriTable';
import TamuTable from '@/components/admin/peserta/TamuTable';
import SantriModal from '@/components/admin/peserta/SantriModal';
import TamuModal from '@/components/admin/peserta/TamuModal';

export default function ManajemenPesertaPage() {
  const {
    setKeluargaList,
    setUndanganList,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    bagianFilter,
    setBagianFilter,
    statusHadirFilter,
    setStatusHadirFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    showAddModal,
    setShowAddModal,
    showAddUndanganModal,
    setShowAddUndanganModal,
    selectedGolonganUndangan,
    setSelectedGolonganUndangan,
    editingItem,
    setEditingItem,
    deletingItem,
    setDeletingItem,
    qrDetailItem,
    setQrDetailItem,
    qrDataUrl,
    toastMessage,
    showToast,
    showClearModal,
    setShowClearModal,
    clearScope,
    setClearScope,
    handleOpenAddUndangan,
    handleConfirmHapusSemua,
    handleOpenEdit,
    handleConfirmDelete,
    refreshData,
    stats,
    allItems,
  } = usePesertaData();

  const tabsHeader = (
    <PesertaTabs
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      setBagianFilter={setBagianFilter}
      setCurrentPage={setCurrentPage}
      stats={stats}
    />
  );

  return (
    <div className="min-h-screen bg-[#EFE8E1] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <PesertaHeader
        toastMessage={toastMessage}
        setShowAddModal={setShowAddModal}
        handleOpenAddUndangan={handleOpenAddUndangan}
      />

      {activeTab.startsWith('UNDANGAN') ? (
        <TamuTable
          tabsHeader={tabsHeader}
          activeTab={activeTab}
          allItems={allItems}
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          bagianFilter={bagianFilter}
          setBagianFilter={setBagianFilter}
          statusHadirFilter={statusHadirFilter}
          setStatusHadirFilter={setStatusHadirFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setQrDetailItem={setQrDetailItem}
          handleOpenEdit={handleOpenEdit}
          setDeletingItem={setDeletingItem}
          onRefreshData={refreshData}
          showToast={showToast}
        />
      ) : (
        <SantriTable
          tabsHeader={tabsHeader}
          activeTab={activeTab}
          allItems={allItems}
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          bagianFilter={bagianFilter}
          setBagianFilter={setBagianFilter}
          statusHadirFilter={statusHadirFilter}
          setStatusHadirFilter={setStatusHadirFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setQrDetailItem={setQrDetailItem}
          handleOpenEdit={handleOpenEdit}
          setDeletingItem={setDeletingItem}
          onRefreshData={refreshData}
          showToast={showToast}
        />
      )}

      <SantriModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onAddSuccess={async (newSantriItem, msg) => {
          setKeluargaList((prev) => [newSantriItem, ...prev]);
          showToast(msg);
          await refreshData();
        }}
        onEditSuccess={async (msg) => {
          await refreshData();
          showToast(msg);
        }}
      />

      <TamuModal
        showAddUndanganModal={showAddUndanganModal}
        setShowAddUndanganModal={setShowAddUndanganModal}
        selectedGolonganUndangan={selectedGolonganUndangan}
        setSelectedGolonganUndangan={setSelectedGolonganUndangan}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onAddSuccess={async (newUndanganItem, msg) => {
          setUndanganList((prev) => [newUndanganItem, ...prev]);
          showToast(msg);
          await refreshData();
        }}
        onEditSuccess={async (msg) => {
          await refreshData();
          showToast(msg);
        }}
      />

      <PesertaUtilityModals
        deletingItem={deletingItem}
        setDeletingItem={setDeletingItem}
        handleConfirmDelete={handleConfirmDelete}
        showClearModal={showClearModal}
        setShowClearModal={setShowClearModal}
        clearScope={clearScope}
        setClearScope={setClearScope}
        handleConfirmHapusSemua={handleConfirmHapusSemua}
        stats={stats}
        qrDetailItem={qrDetailItem}
        setQrDetailItem={setQrDetailItem}
        qrDataUrl={qrDataUrl}
        showToast={showToast}
      />
    </div>
  );
}
