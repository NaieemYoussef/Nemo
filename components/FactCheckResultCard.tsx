import React from 'react';
import { FactCheckItem, AssessmentStatus } from '../types';

interface FactCheckResultCardProps {
  item: FactCheckItem;
}

const getStatusColorClasses = (status: AssessmentStatus): string => {
  switch (status) {
    case "صحيح":
      return "bg-green-100 border-green-500 text-green-700";
    case "خاطئ":
      return "bg-red-100 border-red-500 text-red-700";
    case "يحتاج لتوضيح":
      return "bg-yellow-100 border-yellow-500 text-yellow-700";
    case "غير دقيق":
        return "bg-orange-100 border-orange-500 text-orange-700"; // Example, similar to yellow
    case "تعذر التحقق":
      return "bg-gray-100 border-gray-500 text-gray-700";
    default:
      return "bg-gray-100 border-gray-400 text-gray-600";
  }
};


const FactCheckResultCard: React.FC<FactCheckResultCardProps> = ({ item }) => {
  const statusColor = getStatusColorClasses(item.assessment_status);

  return (
    <div className="border border-teal-600 bg-teal-700 p-4 rounded-lg shadow">
      <div className="mb-2">
        <strong className="block text-sm font-medium text-cyan-200">الادعاء الأصلي:</strong>
        <p className="text-slate-100 text-sm">{item.original_claim}</p>
      </div>
      <div className="mb-2">
        <strong className="block text-sm font-medium text-cyan-200">التقييم:</strong>
        <p className={`px-2 py-1 inline-block rounded text-xs font-semibold border ${statusColor}`}>
          {item.assessment_status}
        </p>
      </div>
      <div>
        <strong className="block text-sm font-medium text-cyan-200">الأساس المنطقي:</strong>
        <p className="text-slate-200 text-sm whitespace-pre-wrap">{item.assessment_details}</p>
      </div>
    </div>
  );
};

export default FactCheckResultCard;
