'use client';

import AuthGuard from '@/components/AuthGuard';
import { useVerifikasiData } from '@/lib/hooks/useVerifikasiData';
import {
  VerifikasiHeaderAndStats,
  VerifikasiOrdersTable,
} from '@/components/admin/verifikasi/VerifikasiStatsAndTable';
import { VerifikasiModals } from '@/components/admin/verifikasi/VerifikasiModals';

export default function VerifikasiPage() {
  const {
    pembelianList,
    loadingData,
    errorMessage,
    statusMsg,
    setStatusMsg,
    previewBuktiModal,
    setPreviewBuktiModal,
    isProcessing,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    showAddManualModal,
    setShowAddManualModal,
    searchSantriText,
    setSearchSantriText,
    selectedSantriKode,
    setSelectedSantriKode,
    manualJumlah,
    setManualJumlah,
    manualMetode,
    setManualMetode,
    manualLangsungVerifikasi,
    setManualLangsungVerifikasi,
    manualKirimWa,
    setManualKirimWa,
    isSubmittingManual,
    fetchData,
    santriMap,
    paguTerjual,
    sisaPagu,
    countMenungguVerifikasi,
    countMenungguPembayaran,
    countDiverifikasi,
    countBatal,
    filteredOrders,
    filteredSantriList,
    selectedSantri,
    handleVerifikasiOrder,
    handleTolakOrder,
    handleSubmitTambahManual,
  } = useVerifikasiData();

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-[#FAF7F3] space-y-6 selection:bg-[#8C6A47]/20 pb-20">
        <VerifikasiHeaderAndStats
          setShowAddManualModal={setShowAddManualModal}
          paguTerjual={paguTerjual}
          sisaPagu={sisaPagu}
          countMenungguVerifikasi={countMenungguVerifikasi}
          countMenungguPembayaran={countMenungguPembayaran}
          errorMessage={errorMessage}
          fetchData={fetchData}
          statusMsg={statusMsg}
          setStatusMsg={setStatusMsg}
        />

        <VerifikasiOrdersTable
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          pembelianListLength={pembelianList.length}
          countMenungguVerifikasi={countMenungguVerifikasi}
          countMenungguPembayaran={countMenungguPembayaran}
          countDiverifikasi={countDiverifikasi}
          countBatal={countBatal}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loadingData={loadingData}
          filteredOrders={filteredOrders}
          santriMap={santriMap}
          setPreviewBuktiModal={setPreviewBuktiModal}
          isProcessing={isProcessing}
          handleVerifikasiOrder={handleVerifikasiOrder}
          handleTolakOrder={handleTolakOrder}
        />

        <VerifikasiModals
          previewBuktiModal={previewBuktiModal}
          setPreviewBuktiModal={setPreviewBuktiModal}
          showAddManualModal={showAddManualModal}
          setShowAddManualModal={setShowAddManualModal}
          handleSubmitTambahManual={handleSubmitTambahManual}
          searchSantriText={searchSantriText}
          setSearchSantriText={setSearchSantriText}
          selectedSantriKode={selectedSantriKode}
          setSelectedSantriKode={setSelectedSantriKode}
          filteredSantriList={filteredSantriList}
          selectedSantri={selectedSantri}
          manualJumlah={manualJumlah}
          setManualJumlah={setManualJumlah}
          manualMetode={manualMetode}
          setManualMetode={setManualMetode}
          manualLangsungVerifikasi={manualLangsungVerifikasi}
          setManualLangsungVerifikasi={setManualLangsungVerifikasi}
          manualKirimWa={manualKirimWa}
          setManualKirimWa={setManualKirimWa}
          isSubmittingManual={isSubmittingManual}
        />
      </div>
    </AuthGuard>
  );
}
