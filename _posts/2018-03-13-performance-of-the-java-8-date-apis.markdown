---
title: Performance of the Java 8 Date APIs
categories:
- Development
tags:
- Java
---

At the weekend I was skimming over the parts of the OCA exam book which are new for Java 8, and the comparison on working with the new java.time APIs versus the previous java.util offerings got me thinking about performance. Recently I had been looking at a bit of code which was creating objects based on an object loaded from a database table with the fields shown below. 

{% highlight java %}
    private java.util.Date date;
    private int startHour;
    private int startMinute;
    private int endHour;
    private int endMinute
{% endhighlight %}

The date in this object is set to midnight time. Based on this object the code was then making two java.util.Date objects, one for each time on the date. This requires a trip in to a Calendar object to set the time fields, then converting back to a Date. This appeared to be quite an expensive operation when we were executing it tens of thousands of times during the process of a calculation.   

For a test, I wrote a simple program which created an object representing today's date, and then created 20,000 objects based on this including a time. These steps were performed for both the java.time and java.util approaches. 

{% highlight java linenos %}

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class DateTest {
    
    private static final int ITERATIONS = 20000;
    private final List<Integer> hours;
    private final List<Integer> minutes;
    private final Date midnightToday;
    private final LocalDate today;
    
    public DateTest() {
        /* Initialise lists */
        this.hours = IntStream.range(0, 23).boxed().collect(Collectors.toList());
        this.minutes = IntStream.range(0, 59).boxed().collect(Collectors.toList());
        
        /* Initialise today with the old approach */
        Date date = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.set(Calendar.HOUR, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        this.midnightToday = cal.getTime();
        
        /* Initialise today with the new approach */
        this.today = LocalDate.now();
    }
    
    
    public void checkNewApproach() {

        List<LocalDateTime> createdObjects = new ArrayList<>();

        while (createdObjects.size() < ITERATIONS) {
            for (int hour : hours) {
                for (int minute : minutes) {
                    if (createdObjects.size() < ITERATIONS) {
                        /* Create the object and add to our list. */
                        createdObjects.add(LocalTime.of(hour, minute).atDate(today));
                    }
                }
            }
        }
    }
    
    public void checkOldApproachDate() {

        List<Date> createdObjects = new ArrayList<>();

        while (createdObjects.size() < ITERATIONS) {
            for (int hour : hours) {
                for (int minute : minutes) {
                    if (createdObjects.size() < ITERATIONS) {
                        /* Create the object */

                        Calendar cal = Calendar.getInstance();
                        cal.setTime(midnightToday);
                        cal.set(Calendar.HOUR, hour);
                        cal.set(Calendar.MINUTE, minute);

                        createdObjects.add(cal.getTime());
                    }
                }
            }
        }
    }
    
    
    public static void main(String[] args) {
        
        /* Create */
        DateTest testObj = new DateTest();
        
        /* Test the new approach */
        long newStartTime = System.currentTimeMillis();    
        testObj.checkNewApproach();
        long newEndTime = System.currentTimeMillis();
        
        /* Test the old approach */
        long oldStartTime = System.currentTimeMillis();
        testObj.checkOldApproachDate();
        long oldEndTime = System.currentTimeMillis();
        
        /* Show the results */
        
        System.out.println(String.format(
                "\t%s\t%s", 
                (newEndTime - newStartTime), 
                (oldEndTime - oldStartTime))); 
    }

}


{% endhighlight %} 

I compiled the code and ran the test 10 times, just to rule out  any blips in system performance. 

{% highlight bash %}
javac DateTest.java
for i in {1..10}; do echo $i $(java -cp . DateTest); sleep 2s; done
{% endhighlight %}

It is a crude test, but the results were quite surprising. 

|---
| Run | java.time (ms) | java.util (ms)
|:-:|:-:|:-:
| 1 | 7 | 104
| 2 | 7 | 104
| 3 | 11 | 126
| 4 | 10 | 123
| 5 | 13 | 135
| 6 | 12 | 142
| 7 | 16 | 299
| 8 | 10 | 157
| 9 | 10 | 125
| 10 | 8 | 100

I had expected some performance improvement, but not such a large one. I have no intention of getting into the "why" of the performance improvement, but it does look promising for future developments. 
