import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Dimensions, Image } from 'react-native';
import api, { getImageUrl } from '../services/api';

const BookingScreen = ({ route, navigation }) => {
  const { facilityType, facilityData } = route.params;
  const item = facilityData;

  // Common states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    fetchFacilityBookings();
  }, [item._id]);

  const fetchFacilityBookings = async () => {
    try {
      const res = await api.get(`/bookings/facility/${item._id}`);
      setBookedSlots(res.data.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  };

  // Court/Pool specific states
  const [startTime, setStartTime] = useState(9); // 9 AM
  const [endTime, setEndTime] = useState(10);  // 10 AM
  const [guests, setGuests] = useState(1);

  const isRoom = facilityType === 'room';
  const isCourt = facilityType === 'court';
  const isPool = facilityType === 'pool';
  const isHourly = isCourt || isPool;

  // Calculations
  const getNights = () => {
    if (isRoom && startDate && endDate) {
      return Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const getHourlyAmount = () => {
    if (!isHourly || !startDate) return 0;
    let total = 0;
    // Ensure we have numbers to avoid NaN or 0 if fields are missing
    const dPrice = item.dayPrice || (isPool ? item.pricePerSession : 0) || 0;
    const nPrice = item.nightPrice || (isPool ? item.pricePerSession : 0) || 0;

    for (let h = startTime; h < endTime; h++) {
      let hourPrice = (h >= 9 && h < 17) ? dPrice : nPrice;
      if (isPool) {
        total += (hourPrice * guests);
      } else {
        total += hourPrice;
      }
    }
    return total;
  };

  /** Check if a specific hourly slot (h:00 - h+1:00) is already booked on the selected date */
  const isHourBooked = (h) => {
    if (!startDate || !isHourly) return null;
    
    // Find any booking that overlaps with this specific hour slot
    const match = bookedSlots.find(b => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      
      // Ensure we are comparing the correct date
      if (startDate.toDateString() !== bStart.toDateString()) return false;
      
      const bStartHour = bStart.getHours();
      const bEndHour = bEnd.getHours();
      
      // If a booking is 2 PM - 4 PM, h=14 and h=15 are booked. h=16 is free.
      return h >= bStartHour && h < bEndHour && (b.status === 'confirmed' || b.status === 'pending_verification' || b.status === 'success');
    });

    return match ? match.status : null;
  };

  const nights = getNights();
  const totalPrice = isRoom ? (nights * (item.price || 0)) : getHourlyAmount();

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDayPress = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert('Invalid Date', 'Cannot select past dates');
      return;
    }

    if (isRoom) {
      if (!startDate || (startDate && endDate)) {
        setStartDate(selected);
        setEndDate(null);
      } else if (startDate && !endDate) {
        if (selected > startDate) {
          setEndDate(selected);
        } else if (selected.getTime() === startDate.getTime()) {
          setStartDate(null);
        } else {
          setStartDate(selected);
        }
      }
    } else {
      // Hourly (Court/Pool): Single day selection
      setStartDate(selected);
      setEndDate(selected); 
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isStart = startDate && date.getTime() === startDate.getTime();
      const isEnd = endDate && date.getTime() === endDate.getTime();
      const isInRange = isRoom && startDate && endDate && date > startDate && date < endDate;
      const isPast = date < new Date().setHours(0,0,0,0);

      // Check if day is booked
      let bookingStatus = null;
      if (isRoom) {
        const match = bookedSlots.find(b => {
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          bStart.setHours(0,0,0,0);
          bEnd.setHours(0,0,0,0);
          return date >= bStart && date <= bEnd;
        });
        if (match) bookingStatus = match.status;
      } else {
        const match = bookedSlots.find(b => {
          const bDate = new Date(b.startDate);
          return date.toDateString() === bDate.toDateString();
        });
        if (match) bookingStatus = match.status;
      }

      days.push(
        <TouchableOpacity 
          key={d} 
          style={[
            styles.dayBox, 
            isStart && styles.startDay, 
            (isEnd && isRoom) && styles.endDay, 
            (isEnd && isHourly) && styles.singleDay,
            isInRange && styles.rangeDay,
            isPast && styles.pastDay,
            bookingStatus === 'confirmed' && styles.bookedDay,
            bookingStatus === 'paid_pending_approval' && styles.pendingVerificationDay
          ]}
          onPress={() => !isPast && handleDayPress(d)}
          disabled={isPast || (isRoom && bookingStatus === 'confirmed')}
        >
          <Text style={[
            styles.dayText, 
            (isStart || isEnd || isInRange) && styles.selectedDayText, 
            isPast && styles.pastDayText,
            (bookingStatus === 'confirmed' || bookingStatus === 'paid_pending_approval') && styles.bookedDayText
          ]}>
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.navText}>{"<"}</Text></TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName} {year}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.navText}>{">"}</Text></TouchableOpacity>
        </View>
        <View style={styles.weekHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={styles.weekText}>{d}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>{days}</View>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#dc3545' }]} /><Text style={styles.legendText}>Booked</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ffc107' }]} /><Text style={styles.legendText}>Pending</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#007bff' }]} /><Text style={styles.legendText}>Selected</Text></View>
        </View>
      </View>
    );
  };

  const [errors, setErrors] = useState({});

  const handleBooking = async () => {
    setErrors({});
    const newErrors = {};

    if (!startDate) newErrors.date = 'Please select a date';
    if (isRoom && !endDate) newErrors.date = 'Please select a check-out date';
    
    if (isHourly && startTime >= endTime) {
      newErrors.time = 'End time must be after start time';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalStart = new Date(startDate);
    const finalEnd = new Date(isRoom ? endDate : startDate);

    if (!isRoom) {
      finalStart.setHours(startTime, 0, 0, 0);
      finalEnd.setHours(endTime, 0, 0, 0);
    }

    setLoading(true);
    try {
      const payload = {
        bookingType: facilityType,
        roomId: item._id, // This is the facility ID
        startDate: finalStart.toISOString(),
        endDate: finalEnd.toISOString(),
        totalAmount: totalPrice,
        numberOfGuests: isPool ? guests : 1
      };

      const response = await api.post('/bookings', payload);
      const bookingId = response.data.data._id;
      
      navigation.navigate('Payment', { 
        bookingId,
        totalAmount: totalPrice,
        facilityType,
        facilityName: item.roomName || item.courtName || item.poolName,
        startDate: startDate.toDateString(),
        endDate: endDate ? endDate.toDateString() : null,
        startTime: startTime,
        endTime: endTime,
        guests: isPool ? guests : 1
      });
    } catch (error) {
      console.error('SERVER 400 ERROR DEBUG:', error.response?.data);
      const serverMessage = error.response?.data?.message;
      const serverField = error.response?.data?.field;
      
      if (serverField) {
        setErrors({ [serverField]: serverMessage });
      } else {
        setErrors({ general: serverMessage || 'Booking failed. Please check for scheduling overlaps.' });
        Alert.alert('Booking Error', serverMessage || 'Failed to create booking');
      }
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 25 }, (_, i) => i); // 0 to 24

  return (
    <ScrollView style={styles.container}>
      {/* 1. Property Header */}
      <View style={styles.propertyHeader}>
        <Image 
          source={item.imageUrl ? { uri: getImageUrl(item.imageUrl) } : require('../assets/icon.png')} 
          style={styles.propertyImage} 
          resizeMode="cover"
        />
        <View style={styles.propertyInfo}>
          <View style={styles.headerMain}>
            <View style={styles.titleGroup}>
              <Text style={styles.headerTitle}>{item.roomName || item.courtName || item.poolName}</Text>
              <Text style={styles.facilityCategory}>{facilityType.charAt(0).toUpperCase() + facilityType.slice(1)}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>9.8</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.trustBadge}>
              <Text style={styles.badgeText}>✓ Instant Confirmation</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.badgeText}>✓ Free Cancellation</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.badgeText}>✓ No booking fees</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Selection Section */}
      <Text style={styles.sectionLabel}>Select your dates</Text>
      <View style={styles.card}>
        {renderCalendar()}
        
        {/* Legend inside calendar card for cleaner look */}
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#d32f2f' }]} /><Text style={styles.legendText}>Booked</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#fbc02d' }]} /><Text style={styles.legendText}>Pending</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#007bff' }]} /><Text style={styles.legendText}>Selected</Text></View>
        </View>
      </View>

      {(errors.date || errors.dateRange || errors.general) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.date || errors.dateRange || errors.general}</Text>
        </View>
      )}

      {/* 3. Time Slots & Guests (If applicable) */}
      {(isHourly || isPool) && startDate && (
        <>
          <Text style={styles.sectionLabel}>Stay details</Text>
          <View style={styles.card}>
            {isPool && (
              <View style={[styles.guestRow, { marginBottom: 20 }]}>
                <Text style={styles.guestLabel}>Number of guests</Text>
                <View style={styles.guestControls}>
                  <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(Math.max(1, guests - 1))}>
                    <Text style={styles.guestBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.guestCount}>{guests}</Text>
                  <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(guests + 1)}>
                    <Text style={styles.guestBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isHourly && (
              <>
                <Text style={styles.timeLabel}>Start time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourScroll}>
                  {hours.map(h => {
                    const status = isHourBooked(h);
                    const isBooked = status === 'confirmed' || status === 'success';
                    const isPending = status === 'pending_verification';

                    return (
                      <TouchableOpacity 
                        key={h} 
                        style={[
                          styles.hourBox, 
                          startTime === h && styles.selectedHour,
                          isBooked && styles.bookedHour,
                          isPending && styles.pendingHour
                        ]} 
                        onPress={() => !isBooked && !isPending && setStartTime(h)}
                        disabled={isBooked || isPending}
                      >
                        <Text style={[
                          styles.hourText, 
                          startTime === h && styles.selectedHourText,
                          (isBooked || isPending) && styles.bookedHourText
                        ]}>
                          {h}:00{isBooked ? '\nBooked' : isPending ? '\nPending' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.timeLabel}>End time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourScroll}>
                  {hours.filter(h => h > startTime).map(h => {
                    // For the end time, we check if ANY hour between startTime and this 'h' is booked.
                    // This prevents selecting an end time that "skips over" a booked slot.
                    let hasOverlap = false;
                    for (let checkH = startTime; checkH < h; checkH++) {
                      const status = isHourBooked(checkH);
                      if (status === 'confirmed' || status === 'success' || status === 'pending_verification') {
                        hasOverlap = true;
                        break;
                      }
                    }

                    return (
                      <TouchableOpacity 
                        key={h} 
                        style={[
                          styles.hourBox, 
                          endTime === h && styles.selectedHour,
                          hasOverlap && styles.bookedHour
                        ]} 
                        onPress={() => !hasOverlap && setEndTime(h)}
                        disabled={hasOverlap}
                      >
                        <Text style={[
                          styles.hourText, 
                          endTime === h && styles.selectedHourText,
                          hasOverlap && styles.bookedHourText
                        ]}>
                          {h}:00{hasOverlap ? '\nInvalid' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
            {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
          </View>
        </>
      )}

      {/* 4. Price & Confirm */}
      {(isRoom ? nights > 0 : startDate) && (
        <>
          <Text style={styles.sectionLabel}>Price Summary</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {isRoom ? `${nights} night${nights > 1 ? 's' : ''}` : `${endTime - startTime} hour${(endTime - startTime) > 1 ? 's' : ''}`}
              </Text>
              <Text style={styles.priceVal}>LKR {totalPrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes and charges</Text>
              <Text style={styles.priceVal}>Included</Text>
            </View>
            <View style={[styles.priceRow, { marginTop: 10 }]}>
              <Text style={styles.totalPrice}>Total Price</Text>
              <Text style={styles.totalPrice}>LKR {totalPrice}</Text>
            </View>
          </View>
        </>
      )}

      <TouchableOpacity 
        style={[styles.confirmButton, (loading || !startDate || (isRoom && !endDate)) && styles.disabledButton]} 
        onPress={handleBooking}
        disabled={loading || !startDate || (isRoom && !endDate)}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Process to payment</Text>}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  
  // Property Header
  propertyHeader: { backgroundColor: '#fff', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e7e7e7' },
  propertyImage: { width: '100%', height: 200, backgroundColor: '#eee' },
  propertyInfo: { padding: 15 },
  headerMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleGroup: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  facilityCategory: { fontSize: 14, color: '#003580', fontWeight: 'bold', marginTop: 2 },
  ratingBadge: { backgroundColor: '#003580', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  ratingText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9f0fa', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#003580', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  // Instruction
  sectionLabel: { fontSize: 18, fontWeight: 'bold', color: '#333', margin: 15, marginBottom: 5 },

  // Calendar Card
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 2, padding: 15, borderWidth: 1, borderColor: '#e7e7e7', elevation: 2 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  monthTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  navText: { fontSize: 22, color: '#007bff' },
  weekHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekText: { fontSize: 12, color: '#999', fontWeight: 'bold', width: (Dimensions.get('window').width - 80) / 7, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayBox: { width: (Dimensions.get('window').width - 80) / 7, height: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  emptyDay: { width: (Dimensions.get('window').width - 80) / 7, height: 45 },
  dayText: { fontSize: 14, color: '#333' },
  startDay: { backgroundColor: '#007bff', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  endDay: { backgroundColor: '#007bff', borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  singleDay: { backgroundColor: '#007bff', borderRadius: 4 },
  rangeDay: { backgroundColor: '#ebf3ff' },
  pastDay: { opacity: 0.2 },
  pastDayText: { textDecorationLine: 'line-through' },
  selectedDayText: { color: '#fff', fontWeight: 'bold' },
  bookedDay: { backgroundColor: '#d32f2f', borderRadius: 4 },
  pendingVerificationDay: { backgroundColor: '#fbc02d', borderRadius: 4 },
  bookedDayText: { color: '#fff' },

  // Legend
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 15, borderTopWidth: 1, borderTopColor: '#f2f2f2', paddingTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendText: { fontSize: 11, color: '#666' },

  // Hourly Section
  timeLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  hourScroll: { flexDirection: 'row', marginBottom: 15 },
  hourBox: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 2, marginRight: 8, backgroundColor: '#fff', minWidth: 60, alignItems: 'center' },
  selectedHour: { backgroundColor: '#003580', borderColor: '#003580' },
  bookedHour: { backgroundColor: '#dc3545', borderColor: '#c82333' },
  pendingHour: { backgroundColor: '#ffc107', borderColor: '#e0a800' },
  hourText: { color: '#333', fontSize: 13, textAlign: 'center' },
  selectedHourText: { color: '#fff', fontWeight: 'bold' },
  bookedHourText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },

  // Guests
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guestLabel: { fontSize: 14, color: '#333' },
  guestControls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  guestBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#007bff', justifyContent: 'center', alignItems: 'center' },
  guestBtnText: { color: '#007bff', fontSize: 20, lineHeight: 22 },
  guestCount: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  // Summary
  priceCard: { backgroundColor: '#ebf3ff', margin: 12, padding: 15, borderRadius: 2, borderLeftWidth: 4, borderLeftColor: '#003580' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  priceLabel: { fontSize: 14, color: '#333' },
  priceVal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalPrice: { fontSize: 22, fontWeight: 'bold', color: '#003580' },

  // Error
  errorBanner: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#f44336', padding: 12, marginHorizontal: 12, marginTop: 5, borderRadius: 2 },
  errorBannerText: { color: '#f44336', fontSize: 13, fontWeight: 'bold' },
  errorText: { color: '#f44336', fontSize: 12, marginTop: 5 },

  // Button
  confirmButton: { backgroundColor: '#003580', margin: 12, padding: 16, borderRadius: 2, alignItems: 'center' },
  disabledButton: { backgroundColor: '#a3abb5' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default BookingScreen;
