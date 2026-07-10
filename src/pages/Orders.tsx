import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import { 
  Clock,
  MoreVertical, 
  Printer, 
  TrendingDown, 
  CheckSquare2, 
  CheckCheck,
  AlertTriangle,
  Zap
} from 'lucide-react';

export const Orders: React.FC = () => {
  const { orders, updateOrderStatus } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering orders
  const filterBySearch = (list: typeof orders) => {
    return list.filter(o => 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.tableId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items.some(i => i.menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const pendingOrders = filterBySearch(orders.filter(o => o.status === 'PENDING'));
  const preparingOrders = filterBySearch(orders.filter(o => o.status === 'PREPARING'));
  const readyOrders = filterBySearch(orders.filter(o => o.status === 'READY'));
  const completedOrders = filterBySearch(orders.filter(o => o.status === 'COMPLETED'));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Top Navigation */}
      <TopNavBar title="Orders Console" onSearchChange={setSearchTerm} />

      {/* Main Content Area */}
      <main className="p-xl overflow-y-auto">
        <div className="max-w-[1440px] mx-auto space-y-lg">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Order Management</h2>
              <p className="text-on-surface-variant font-body-md">Track and manage live floor operations in real-time.</p>
            </div>
            <div className="flex flex-wrap gap-sm">
              <span className="px-md py-2 bg-primary-container/10 text-primary border border-primary-container rounded-full font-label-md flex items-center gap-xs text-xs font-semibold">
                Pending ({pendingOrders.length})
              </span>
              <span className="px-md py-2 bg-surface-container-highest text-on-surface-variant rounded-full font-label-md flex items-center gap-xs text-xs font-semibold">
                Preparing ({preparingOrders.length})
              </span>
              <span className="px-md py-2 bg-surface-container-highest text-on-surface-variant rounded-full font-label-md flex items-center gap-xs text-xs font-semibold">
                Ready ({readyOrders.length})
              </span>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
            
            {/* Live Orders Column (8 Columns) */}
            <div className="xl:col-span-8 space-y-md">
              <div className="flex items-center justify-between mb-sm">
                <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm">
                  Live Orders
                  <span className="bg-primary text-white text-[12px] px-2 py-0.5 rounded-full font-bold">
                    {pendingOrders.length + preparingOrders.length + readyOrders.length}
                  </span>
                </h3>
              </div>

              {/* Bento Grid layout for active orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                
                {/* Pending List */}
                {pendingOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl border border-outline-variant card-shadow p-md flex flex-col gap-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary-container"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">Order #{order.id}</h4>
                        <p className="text-primary font-semibold flex items-center gap-xs text-sm">
                          Table {order.tableId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="bg-surface-container text-on-surface-variant px-sm py-1 rounded font-label-sm text-xs font-medium">{order.time}</span>
                        <span className="text-primary font-label-sm font-bold flex items-center gap-xs mt-1 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {order.elapsedMinutes}m elapsed
                        </span>
                      </div>
                    </div>

                    <div className="space-y-sm py-sm border-y border-surface-container-highest pl-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-body-md text-sm">
                          <span className="text-on-surface">{item.quantity}x {item.menuItem.name}</span>
                          <span className="text-outline">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-sm mt-auto pl-1">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="flex-1 py-2 bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-label-md rounded-lg font-semibold transition-all text-sm"
                      >
                        Start Preparing
                      </button>
                      <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                        <MoreVertical className="w-4 h-4 text-outline" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Preparing List */}
                {preparingOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl border border-outline-variant card-shadow p-md flex flex-col gap-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface">Order #{order.id}</h4>
                        <p className="text-primary font-semibold flex items-center gap-xs text-sm">
                          Table {order.tableId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="bg-surface-container text-on-surface-variant px-sm py-1 rounded font-label-sm text-xs font-medium">{order.time}</span>
                        <span className="text-tertiary font-label-sm font-bold flex items-center gap-xs mt-1 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {order.elapsedMinutes}m elapsed
                        </span>
                      </div>
                    </div>

                    <div className="space-y-sm py-sm border-y border-surface-container-highest pl-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-body-md text-sm">
                          <span className="text-on-surface">{item.quantity}x {item.menuItem.name}</span>
                          <span className="text-outline">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.allergyAlert && (
                        <div className="flex items-center gap-xs text-xs font-semibold text-tertiary">
                          <AlertTriangle className="w-4 h-4" />
                          <span>ALLERGY ALERT: {order.allergyAlert}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-sm mt-auto pl-1">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="flex-1 py-2 bg-primary text-white rounded-lg font-label-md hover:opacity-90 font-semibold transition-all text-sm"
                      >
                        Mark Ready
                      </button>
                      <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                        <MoreVertical className="w-4 h-4 text-outline" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Ready List */}
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl border border-primary-container/30 card-shadow p-md flex flex-col gap-md bg-primary-container/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div>
                        <div className="flex items-center gap-sm">
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Order #{order.id}</h4>
                          <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Ready</span>
                        </div>
                        <p className="text-primary font-semibold flex items-center gap-xs text-sm">
                          Table {order.tableId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="bg-surface-container text-on-surface-variant px-sm py-1 rounded font-label-sm text-xs font-medium">{order.time}</span>
                        <span className="text-outline-variant font-label-sm font-bold flex items-center gap-xs mt-1 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {order.elapsedMinutes}m elapsed
                        </span>
                      </div>
                    </div>

                    <div className="space-y-sm py-sm border-y border-surface-container-highest pl-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-body-md text-sm opacity-60">
                          <span className="text-on-surface">{item.quantity}x {item.menuItem.name}</span>
                          <span className="text-outline">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-sm mt-auto pl-1">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        className="flex-1 py-2 bg-secondary text-white rounded-lg font-label-md hover:opacity-90 font-semibold transition-all text-sm"
                      >
                        Serve & Deliver
                      </button>
                      <button 
                        onClick={() => alert(`Printing Receipt for Order #${order.id}...`)}
                        className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors"
                      >
                        <Printer className="w-4 h-4 text-outline" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {pendingOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (
                  <div className="col-span-2 bg-white rounded-xl border border-outline-variant/30 p-xl text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[300px]">
                    <CheckSquare2 className="w-12 h-12 text-outline mb-sm" />
                    <h4 className="font-headline-sm font-semibold">No active orders</h4>
                    <p className="text-sm mt-xs">All placed orders have been successfully prepared and served!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Completed Orders Column (4 Columns) */}
            <div className="xl:col-span-4 space-y-md">
              <div className="flex items-center justify-between mb-sm">
                <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm text-on-surface-variant">
                  Completed
                  <span className="bg-surface-container-highest text-on-surface-variant text-[12px] px-2 py-0.5 rounded-full font-bold">
                    {completedOrders.length} Today
                  </span>
                </h3>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md space-y-md max-h-[500px] overflow-y-auto custom-scrollbar">
                {completedOrders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => alert(`Order details:\nID: #${order.id}\nTable: ${order.tableId}\nTotal: ₹${order.amount.toFixed(2)}`)}
                    className="flex items-center gap-md p-sm hover:bg-surface-container-highest rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      <CheckCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between">
                        <span className="font-semibold text-on-surface text-sm">#{order.id} • Table {order.tableId}</span>
                        <span className="text-[10px] text-outline">{order.time}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-xs">
                      <p className="font-bold text-on-surface text-sm">₹{order.amount.toFixed(2)}</p>
                      <p className="text-[9px] text-primary uppercase font-bold">Paid</p>
                    </div>
                  </div>
                ))}
                {completedOrders.length === 0 && (
                  <p className="text-center text-xs text-on-surface-variant py-md">No orders completed yet during this shift.</p>
                )}
              </div>

              {/* Stats Card */}
              <div className="bg-primary text-white rounded-xl p-lg relative overflow-hidden card-shadow">
                <div className="relative z-10">
                  <p className="text-primary-fixed font-label-md uppercase tracking-widest opacity-80 text-xs font-semibold">Floor Efficiency</p>
                  <h4 className="text-display font-display mt-xs font-bold text-4xl">18.4m</h4>
                  <p className="text-body-sm text-primary-fixed-dim mt-xs flex items-center gap-xs text-xs">
                    <TrendingDown className="w-4 h-4" />
                    2.4m faster than yesterday
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Zap className="w-24 h-24" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};
export default Orders;
